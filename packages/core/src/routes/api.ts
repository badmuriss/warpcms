import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { Scalar } from '@scalar/hono-api-reference'
import { cors } from 'hono/cors'
import { schemaDefinitions } from '../schemas'
import { getCacheService, CACHE_CONFIGS } from '../services'
import { QueryFilterBuilder, QueryFilter } from '../utils'
import { isPluginActive } from '../middleware'
import apiContentCrudRoutes from './api-content-crud'
import { apiAuthRoutes } from './api-auth'
import { apiMediaRoutes } from './api-media'
import { apiSystemRoutes } from './api-system'
import { openAPIDocInfo, openAPITags } from './openapi-app'
import type { Bindings, Variables as AppVariables } from '../app'
import {
  ContentItemSchema,
  ErrorResponseSchema,
  HealthCheckSchema,
  ServerErrorSchema,
} from '../schemas/api-schemas'

// Extend Variables with API-specific fields
interface Variables extends AppVariables {
  startTime: number
  cacheEnabled?: boolean
}

const apiRoutes = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>()

// Register bearerAuth security scheme for the generated OpenAPI spec
apiRoutes.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

// Add timing middleware
apiRoutes.use('*', async (c, next) => {
  const startTime = Date.now()
  c.set('startTime', startTime)
  await next()
  const totalTime = Date.now() - startTime
  c.header('X-Response-Time', `${totalTime}ms`)
})

// Check if cache plugin is active
apiRoutes.use('*', async (c, next) => {
  const cacheEnabled = await isPluginActive(c.env.DB, 'core-cache')
  c.set('cacheEnabled', cacheEnabled)
  await next()
})

// Add CORS middleware
apiRoutes.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// Helper function to add timing metadata
function addTimingMeta(c: any, meta: any = {}, executionStartTime?: number) {
  const totalTime = Date.now() - c.get('startTime')
  const executionTime = executionStartTime ? Date.now() - executionStartTime : undefined

  return {
    ...meta,
    timing: {
      total: totalTime,
      execution: executionTime,
      unit: 'ms'
    }
  }
}

// Mount API sub-routers so their OpenAPI routes contribute to the generated spec
apiRoutes.route('/auth', apiAuthRoutes)
apiRoutes.route('/media', apiMediaRoutes)
apiRoutes.route('/system', apiSystemRoutes)

// Auto-generated OpenAPI 3.0.0 specification at GET /api/
apiRoutes.doc('/', {
  openapi: '3.0.0',
  info: openAPIDocInfo,
  tags: [...openAPITags],
})

// Interactive API documentation at GET /api/docs
apiRoutes.get('/docs', Scalar({ url: '/api/' }))

// --- GET /health route definition ---

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Health Check',
  description: 'Returns API health status and available schemas',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthCheckSchema } },
      description: 'Health status',
    },
  },
})

apiRoutes.openapi(healthRoute, (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    schemas: schemaDefinitions.map(s => s.name),
  }, 200)
})

// --- GET /content route definition ---

const ContentListQuerySchema = z.object({
  collection: z.string().optional(),
  limit: z.coerce.number().int().max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

const ContentListResponseSchema = z.object({
  data: z.array(ContentItemSchema),
  meta: z.record(z.string(), z.unknown()),
})

const getContentRoute = createRoute({
  method: 'get',
  path: '/content',
  tags: ['Content'],
  summary: 'List Content',
  description: 'Returns content items with advanced filtering support',
  request: {
    query: ContentListQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ContentListResponseSchema } },
      description: 'List of content items',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Invalid filter parameters',
    },
    500: {
      content: { 'application/json': { schema: ServerErrorSchema } },
      description: 'Internal server error',
    },
  },
})

// Basic content endpoint with advanced filtering
apiRoutes.openapi(getContentRoute, async (c) => {
  const executionStart = Date.now()

  try {
    const db = c.env.DB
    const queryParams = c.req.query()

    // Handle collection parameter - convert collection name to collection_id
    if (queryParams.collection) {
      const collectionName = queryParams.collection
      const collectionStmt = db.prepare('SELECT id FROM collections WHERE name = ? AND is_active = 1')
      const collectionResult = await collectionStmt.bind(collectionName).first()

      if (collectionResult) {
        // Replace 'collection' param with 'collection_id' for the filter builder
        queryParams.collection_id = (collectionResult as any).id
        delete queryParams.collection
      } else {
        // Collection not found - return empty result
        return c.json({
          data: [],
          meta: addTimingMeta(c, {
            count: 0,
            timestamp: new Date().toISOString(),
            message: `Collection '${collectionName}' not found`
          }, executionStart)
        })
      }
    }

    // Parse filter from query parameters
    const filter: QueryFilter = QueryFilterBuilder.parseFromQuery(queryParams)

    // Set default limit if not provided
    if (!filter.limit) {
      filter.limit = 50
    }
    filter.limit = Math.min(filter.limit, 1000) // Max 1000

    // Build SQL query from filter
    const builder = new QueryFilterBuilder()
    const queryResult = builder.build('content', filter)

    // Check for query building errors
    if (queryResult.errors.length > 0) {
      return c.json({
        error: 'Invalid filter parameters',
        details: queryResult.errors
      }, 400)
    }

    // Only use cache if cache plugin is active
    const cacheEnabled = c.get('cacheEnabled')
    const cache = getCacheService(CACHE_CONFIGS.api!)
    const cacheKey = cache.generateKey('content-filtered', JSON.stringify({ filter, query: queryResult.sql }))

    if (cacheEnabled) {
      const cacheResult = await cache.getWithSource<any>(cacheKey)
      if (cacheResult.hit && cacheResult.data) {
        // Add cache headers
        c.header('X-Cache-Status', 'HIT')
        c.header('X-Cache-Source', cacheResult.source)
        if (cacheResult.ttl) {
          c.header('X-Cache-TTL', Math.floor(cacheResult.ttl).toString())
        }

        // Add cache info and timing to meta
        const dataWithMeta = {
          ...cacheResult.data,
          meta: addTimingMeta(c, {
            ...cacheResult.data.meta,
            cache: {
              hit: true,
              source: cacheResult.source,
              ttl: cacheResult.ttl ? Math.floor(cacheResult.ttl) : undefined
            }
          }, executionStart)
        }

        return c.json(dataWithMeta)
      }
    }

    // Cache miss - fetch from database
    c.header('X-Cache-Status', 'MISS')
    c.header('X-Cache-Source', 'database')

    // Execute query with parameters
    const stmt = db.prepare(queryResult.sql)
    const boundStmt = queryResult.params.length > 0
      ? stmt.bind(...queryResult.params)
      : stmt

    const { results } = await boundStmt.all()

    // Transform results to match API spec (camelCase)
    const transformedResults = results.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      collectionId: row.collection_id,
      data: row.data ? JSON.parse(row.data) : {},
      created_at: row.created_at,
      updated_at: row.updated_at
    }))

    const responseData = {
      data: transformedResults,
      meta: addTimingMeta(c, {
        count: results.length,
        timestamp: new Date().toISOString(),
        filter: filter,
        query: {
          sql: queryResult.sql,
          params: queryResult.params
        },
        cache: {
          hit: false,
          source: 'database'
        }
      }, executionStart)
    }

    // Cache the response only if cache is enabled
    if (cacheEnabled) {
      await cache.set(cacheKey, responseData)
    }

    return c.json(responseData)
  } catch (error) {
    console.error('Error fetching content:', error)
    return c.json({
      error: 'Failed to fetch content',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// Mount CRUD routes for content
apiRoutes.route('/content', apiContentCrudRoutes)

export default apiRoutes
