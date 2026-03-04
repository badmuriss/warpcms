import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { requireAuth } from '../middleware'
import { getCacheService, CACHE_CONFIGS, parseCacheTtl } from '../services'
import { getContentType } from '../content-types'
import { ErrorResponseSchema, ServerErrorSchema, FlatContentSchema, ContentMutationSchema } from '../schemas/api-schemas'
import type { Bindings, Variables } from '../app'

/** Flatten raw content row into the public API shape with `value` + `meta` */
function flattenContent(row: any) {
  const data = row.data ? JSON.parse(row.data) : {}
  const contentTypeName = row.collection_id as string
  const ct = getContentType(contentTypeName)
  const primaryField = ct?.primaryField

  const value = primaryField ? (data[primaryField] ?? null) : null
  const meta: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (k !== 'title' && k !== primaryField) {
      meta[k] = v
    }
  }

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    contentType: contentTypeName,
    value,
    meta,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

const apiContentCrudRoutes = new OpenAPIHono<{ Bindings: Bindings; Variables: Variables }>()

// Register bearerAuth security scheme for this sub-router
apiContentCrudRoutes.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
})

// --- Shared schemas ---

const FlatContentResponseSchema = z.object({ data: FlatContentSchema })
const NotFoundSchema = z.object({ error: z.string() })

// --- GET /check-slug ---

const CheckSlugQuerySchema = z.object({
  slug: z.string().openapi({ description: 'Slug to check availability for' }),
  excludeId: z.string().optional().openapi({ description: 'Content ID to exclude (for edits)' }),
})

const SlugAvailableSchema = z.object({
  available: z.boolean(),
  message: z.string().optional(),
})

const checkSlugRoute = createRoute({
  method: 'get',
  path: '/check-slug',
  tags: ['Content'],
  summary: 'Check Slug Availability',
  description: 'Checks if a URL slug is available (globally unique)',
  request: {
    query: CheckSlugQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SlugAvailableSchema } },
      description: 'Slug availability result',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Missing slug parameter',
    },
    500: {
      content: { 'application/json': { schema: ServerErrorSchema } },
      description: 'Internal server error',
    },
  },
})

apiContentCrudRoutes.openapi(checkSlugRoute, async (c) => {
  try {
    const db = c.env.DB
    const { slug, excludeId } = c.req.valid('query')

    if (!slug) {
      return c.json({ error: 'slug is required' }, 400)
    }

    let query = 'SELECT id FROM content WHERE slug = ?'
    const params: string[] = [slug]

    if (excludeId) {
      query += ' AND id != ?'
      params.push(excludeId)
    }

    const existing = await db.prepare(query).bind(...params).first()

    if (existing) {
      return c.json({
        available: false as const,
        message: 'This URL slug is already in use',
      }, 200)
    }

    return c.json({ available: true as const }, 200)
  } catch (error: unknown) {
    console.error('Error checking slug:', error)
    return c.json({
      error: 'Failed to check slug availability',
      details: error instanceof Error ? error.message : String(error),
    }, 500)
  }
})

// --- GET /by-slug/:slug ---

const getBySlugRoute = createRoute({
  method: 'get',
  path: '/by-slug/{slug}',
  tags: ['Content'],
  summary: 'Get Content by Slug',
  description: 'Retrieves a single content item by its URL slug',
  request: {
    params: z.object({
      slug: z.string().openapi({ description: 'Content URL slug' }),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: FlatContentResponseSchema } },
      description: 'Content item',
    },
    404: {
      content: { 'application/json': { schema: NotFoundSchema } },
      description: 'Content not found',
    },
    500: {
      content: { 'application/json': { schema: ServerErrorSchema } },
      description: 'Internal server error',
    },
  },
})

apiContentCrudRoutes.openapi(getBySlugRoute, async (c) => {
  try {
    const { slug } = c.req.valid('param')
    const db = c.env.DB

    const ttl = parseCacheTtl(c.env)
    const cache = getCacheService({ ttl, keyPrefix: 'content' }, c.env.CACHE_KV)
    const cacheKey = `content:by-slug:${slug}`

    const cacheResult = await cache.getWithSource<any>(cacheKey)
    if (cacheResult.hit && cacheResult.data) {
      c.header('X-Cache-Status', 'HIT')
      c.header('X-Cache-Source', cacheResult.source)
      return c.json({ data: cacheResult.data }, 200)
    }

    const stmt = db.prepare('SELECT * FROM content WHERE slug = ?')
    const content = await stmt.bind(slug).first()

    if (!content) {
      return c.json({ error: 'Content not found' }, 404)
    }

    const flatContent = flattenContent(content)

    await cache.set(cacheKey, flatContent)

    c.header('X-Cache-Status', 'MISS')
    c.header('X-Cache-Source', 'database')
    return c.json({ data: flatContent }, 200)
  } catch (error) {
    console.error('Error fetching content by slug:', error)
    return c.json({
      error: 'Failed to fetch content',
      details: error instanceof Error ? error.message : String(error),
    }, 500)
  }
})

// --- GET /:id ---

const getContentByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Content'],
  summary: 'Get Content by ID',
  description: 'Retrieves a single content item by its ID',
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Content item ID' }),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: FlatContentResponseSchema } },
      description: 'Content item',
    },
    404: {
      content: { 'application/json': { schema: NotFoundSchema } },
      description: 'Content not found',
    },
    500: {
      content: { 'application/json': { schema: ServerErrorSchema } },
      description: 'Internal server error',
    },
  },
})

apiContentCrudRoutes.openapi(getContentByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid('param')
    const db = c.env.DB

    const ttl = parseCacheTtl(c.env)
    const cache = getCacheService({ ttl, keyPrefix: 'content' }, c.env.CACHE_KV)
    const cacheKey = `content:by-id:${id}`

    const cacheResult = await cache.getWithSource<any>(cacheKey)
    if (cacheResult.hit && cacheResult.data) {
      c.header('X-Cache-Status', 'HIT')
      c.header('X-Cache-Source', cacheResult.source)
      return c.json({ data: cacheResult.data }, 200)
    }

    const stmt = db.prepare('SELECT * FROM content WHERE id = ?')
    const content = await stmt.bind(id).first()

    if (!content) {
      return c.json({ error: 'Content not found' }, 404)
    }

    const flatContent = flattenContent(content)

    await cache.set(cacheKey, flatContent)

    c.header('X-Cache-Status', 'MISS')
    c.header('X-Cache-Source', 'database')
    return c.json({ data: flatContent }, 200)
  } catch (error) {
    console.error('Error fetching content:', error)
    return c.json({
      error: 'Failed to fetch content',
      details: error instanceof Error ? error.message : String(error),
    }, 500)
  }
})

// --- POST / (Create Content) ---

const CreateContentBodySchema = z.object({
  collectionId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().optional(),
  data: z.unknown().optional(),
})

const CreateContentResponseSchema = z.object({
  data: ContentMutationSchema,
})

const postContentRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Content'],
  summary: 'Create Content',
  description: 'Creates a new content item',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateContentBodySchema },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: CreateContentResponseSchema } },
      description: 'Content created successfully',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Validation error',
    },
    409: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Duplicate slug',
    },
    500: {
      content: { 'application/json': { schema: ServerErrorSchema } },
      description: 'Internal server error',
    },
  },
})

// Auth middleware for POST /
apiContentCrudRoutes.post('/', requireAuth())

apiContentCrudRoutes.openapi(postContentRoute, async (c) => {
  try {
    const db = c.env.DB
    const user = c.get('user')
    const { collectionId, title, slug, data } = c.req.valid('json')

    // Generate slug from title if not provided
    let finalSlug = slug || title
    finalSlug = finalSlug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check for duplicate slug (globally unique)
    const duplicateCheck = db.prepare(
      'SELECT id FROM content WHERE slug = ?'
    )
    const existing = await duplicateCheck.bind(finalSlug).first()

    if (existing) {
      return c.json({ error: 'A content item with this slug already exists' }, 409)
    }

    // Create new content
    const contentId = crypto.randomUUID()
    const now = Date.now()

    const insertStmt = db.prepare(`
      INSERT INTO content (
        id, collection_id, slug, title, data,
        author_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    await insertStmt.bind(
      contentId,
      collectionId,
      finalSlug,
      title,
      JSON.stringify(data || {}),
      user?.userId || 'system',
      now,
      now
    ).run()

    // Invalidate cache
    const cache = getCacheService(CACHE_CONFIGS.api!)
    await cache.invalidate('content:list:*')
    await cache.invalidate('content:by-slug:*')
    await cache.invalidate('content-filtered:*')

    // Get the created content
    const getStmt = db.prepare('SELECT * FROM content WHERE id = ?')
    const createdContent = await getStmt.bind(contentId).first() as any

    return c.json({
      data: {
        id: createdContent.id,
        title: createdContent.title,
        slug: createdContent.slug,
        contentType: createdContent.collection_id,
        data: createdContent.data ? JSON.parse(createdContent.data) : {},
        created_at: createdContent.created_at,
        updated_at: createdContent.updated_at
      }
    }, 201)
  } catch (error) {
    console.error('Error creating content:', error)
    return c.json({
      error: 'Failed to create content',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// --- PUT /:id (Update Content) ---

const UpdateContentBodySchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  data: z.unknown().optional(),
})

const UpdateContentResponseSchema = z.object({
  data: ContentMutationSchema,
})

const putContentRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Content'],
  summary: 'Update Content',
  description: 'Updates an existing content item by ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Content item ID' }),
    }),
    body: {
      content: {
        'application/json': { schema: UpdateContentBodySchema },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UpdateContentResponseSchema } },
      description: 'Content updated successfully',
    },
    404: {
      content: { 'application/json': { schema: NotFoundSchema } },
      description: 'Content not found',
    },
    409: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Duplicate slug',
    },
    500: {
      content: { 'application/json': { schema: ServerErrorSchema } },
      description: 'Internal server error',
    },
  },
})

// Auth middleware for PUT /:id
apiContentCrudRoutes.put('/:id', requireAuth())

apiContentCrudRoutes.openapi(putContentRoute, async (c) => {
  try {
    const { id } = c.req.valid('param')
    const db = c.env.DB
    const body = c.req.valid('json')

    // Check if content exists
    const existingStmt = db.prepare('SELECT * FROM content WHERE id = ?')
    const existing = await existingStmt.bind(id).first() as any

    if (!existing) {
      return c.json({ error: 'Content not found' }, 404)
    }

    // Build update fields dynamically
    const updates: string[] = []
    const params: any[] = []

    if (body.title !== undefined) {
      updates.push('title = ?')
      params.push(body.title)
    }

    if (body.slug !== undefined) {
      let finalSlug = body.slug.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      // Check for duplicate slug (globally unique, excluding current item)
      const slugCheck = await db.prepare(
        'SELECT id FROM content WHERE slug = ? AND id != ?'
      ).bind(finalSlug, id).first()

      if (slugCheck) {
        return c.json({ error: 'A content item with this slug already exists' }, 409)
      }

      updates.push('slug = ?')
      params.push(finalSlug)
    }

    if (body.data !== undefined) {
      updates.push('data = ?')
      params.push(JSON.stringify(body.data))
    }

    // Always update updated_at
    const now = Date.now()
    updates.push('updated_at = ?')
    params.push(now)

    // Add id to params for WHERE clause
    params.push(id)

    // Execute update
    const updateStmt = db.prepare(`
      UPDATE content SET ${updates.join(', ')}
      WHERE id = ?
    `)

    await updateStmt.bind(...params).run()

    // Invalidate cache
    const cache = getCacheService(CACHE_CONFIGS.api!)
    await cache.delete(cache.generateKey('content', id))
    await cache.invalidate('content:list:*')
    await cache.invalidate('content:by-slug:*')
    await cache.invalidate('content-filtered:*')

    // Get updated content
    const getStmt = db.prepare('SELECT * FROM content WHERE id = ?')
    const updatedContent = await getStmt.bind(id).first() as any

    return c.json({
      data: {
        id: updatedContent.id,
        title: updatedContent.title,
        slug: updatedContent.slug,
        contentType: updatedContent.collection_id,
        data: updatedContent.data ? JSON.parse(updatedContent.data) : {},
        created_at: updatedContent.created_at,
        updated_at: updatedContent.updated_at
      }
    }, 200)
  } catch (error) {
    console.error('Error updating content:', error)
    return c.json({
      error: 'Failed to update content',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// --- DELETE /:id ---

const DeleteSuccessSchema = z.object({ success: z.boolean() })

const deleteContentRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Content'],
  summary: 'Delete Content',
  description: 'Deletes a content item by ID (hard delete)',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: 'Content item ID' }),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DeleteSuccessSchema } },
      description: 'Content deleted successfully',
    },
    404: {
      content: { 'application/json': { schema: NotFoundSchema } },
      description: 'Content not found',
    },
    500: {
      content: { 'application/json': { schema: ServerErrorSchema } },
      description: 'Internal server error',
    },
  },
})

// Auth middleware for DELETE /:id
apiContentCrudRoutes.delete('/:id', requireAuth())

apiContentCrudRoutes.openapi(deleteContentRoute, async (c) => {
  try {
    const { id } = c.req.valid('param')
    const db = c.env.DB

    // Check if content exists
    const existingStmt = db.prepare('SELECT collection_id FROM content WHERE id = ?')
    const existing = await existingStmt.bind(id).first() as any

    if (!existing) {
      return c.json({ error: 'Content not found' }, 404)
    }

    // Delete the content (hard delete for API, soft delete happens in admin routes)
    const deleteStmt = db.prepare('DELETE FROM content WHERE id = ?')
    await deleteStmt.bind(id).run()

    // Invalidate cache
    const cache = getCacheService(CACHE_CONFIGS.api!)
    await cache.delete(cache.generateKey('content', id))
    await cache.invalidate('content:list:*')
    await cache.invalidate('content:by-slug:*')
    await cache.invalidate('content-filtered:*')

    return c.json({ success: true as const }, 200)
  } catch (error) {
    console.error('Error deleting content:', error)
    return c.json({
      error: 'Failed to delete content',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

export default apiContentCrudRoutes
