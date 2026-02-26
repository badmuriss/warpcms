/**
 * Main Application Factory
 *
 * Creates a configured WarpCMS application with all core functionality
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types'
import {
  apiRoutes,
  apiMediaRoutes,
  apiSystemRoutes,
  adminApiRoutes,
  authRoutes,
  testCleanupRoutes,
  adminContentRoutes,
  adminUsersRoutes,
  adminLogsRoutes,
  adminDashboardRoutes,
  adminSettingsRoutes,
} from './routes'
import { getCoreVersion } from './utils/version'
import { bootstrapMiddleware } from './middleware/bootstrap'
import { metricsMiddleware } from './middleware/metrics'
import { faviconSvg } from './assets/favicon'

// ============================================================================
// Type Definitions
// ============================================================================

export interface Bindings {
  DB: D1Database
  CACHE_KV: KVNamespace
  MEDIA_BUCKET: R2Bucket
  ASSETS: Fetcher
  EMAIL_QUEUE?: Queue
  SENDGRID_API_KEY?: string
  DEFAULT_FROM_EMAIL?: string
  IMAGES_ACCOUNT_ID?: string
  IMAGES_API_TOKEN?: string
  ENVIRONMENT?: string
  BUCKET_NAME?: string
  GOOGLE_MAPS_API_KEY?: string
}

export interface Variables {
  user?: {
    userId: string
    email: string
    role: string
    exp: number
    iat: number
  }
  requestId?: string
  startTime?: number
  appVersion?: string
}

export interface WarpCMSConfig {
  // Custom routes
  routes?: Array<{
    path: string
    handler: Hono
  }>

  // Custom middleware
  middleware?: {
    beforeAuth?: Array<(c: Context, next: () => Promise<void>) => Promise<void>>
    afterAuth?: Array<(c: Context, next: () => Promise<void>) => Promise<void>>
  }

  // App metadata
  version?: string
  name?: string
}

export type WarpCMSApp = Hono<{ Bindings: Bindings; Variables: Variables }>

// ============================================================================
// Application Factory
// ============================================================================

/**
 * Create a WarpCMS application with core functionality
 *
 * @param config - Application configuration
 * @returns Configured Hono application
 *
 * @example
 * ```typescript
 * import { createWarpCMSApp } from '@warpcms/core'
 *
 * const app = createWarpCMSApp({
 *   collections: {
 *     directory: './src/collections',
 *     autoSync: true
 *   },
 *   plugins: {
 *     directory: './src/plugins',
 *     autoLoad: true
 *   }
 * })
 *
 * export default app
 * ```
 */
export function createWarpCMSApp(config: WarpCMSConfig = {}): WarpCMSApp {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

  // Set app metadata
  const appVersion = config.version || getCoreVersion()
  const appName = config.name || 'WarpCMS'

  // App version middleware
  app.use('*', async (c, next) => {
    c.set('appVersion', appVersion)
    await next()
  })

  // Metrics middleware - track all requests for real-time analytics
  app.use('*', metricsMiddleware())

  // Bootstrap middleware - runs migrations, syncs collections, and initializes plugins
  app.use('*', bootstrapMiddleware(config))

  // Custom middleware - before auth
  if (config.middleware?.beforeAuth) {
    for (const middleware of config.middleware.beforeAuth) {
      app.use('*', middleware)
    }
  }

  // Logging middleware
  app.use('*', async (_c, next) => {
    // Logging logic here
    await next()
  })

  // Security middleware
  app.use('*', async (_c, next) => {
    // Security headers, CORS, etc.
    await next()
  })

  // Custom middleware - after auth
  if (config.middleware?.afterAuth) {
    for (const middleware of config.middleware.afterAuth) {
      app.use('*', middleware)
    }
  }

  // Serve uploaded media files from R2 (public, no auth required)
  app.get('/api/media/file/*', async (c) => {
    try {
      if (!c.env.MEDIA_BUCKET) {
        return c.json({ error: 'R2 storage is not configured' }, 503)
      }

      const url = new URL(c.req.url)
      const r2Key = url.pathname.replace(/^\/api\/media\/file\//, '')

      if (!r2Key) {
        return c.notFound()
      }

      const object = await c.env.MEDIA_BUCKET.get(r2Key)

      if (!object) {
        return c.notFound()
      }

      const headers = new Headers()
      object.httpMetadata?.contentType && headers.set('Content-Type', object.httpMetadata.contentType)
      object.httpMetadata?.contentDisposition && headers.set('Content-Disposition', object.httpMetadata.contentDisposition)
      headers.set('Cache-Control', 'public, max-age=31536000')
      headers.set('Access-Control-Allow-Origin', '*')

      return new Response(object.body as any, { headers })
    } catch (error) {
      console.error('Error serving media file:', error)
      return c.json({ error: 'Failed to serve file' }, 500)
    }
  })

  // Core routes
  // Routes are being imported incrementally from routes/*
  // Each route is tested and migrated one-by-one
  app.route('/api', apiRoutes)
  app.route('/api/media', apiMediaRoutes)
  app.route('/api/system', apiSystemRoutes)
  app.route('/admin/api', adminApiRoutes)
  app.route('/admin/dashboard', adminDashboardRoutes)
  app.route('/admin/settings', adminSettingsRoutes)
  app.route('/admin/content', adminContentRoutes)
  app.route('/admin/logs', adminLogsRoutes)
  app.route('/admin', adminUsersRoutes)
  app.route('/auth', authRoutes)

  // Test cleanup routes (only for development/test environments)
  app.route('/', testCleanupRoutes)

  // Serve favicon
  app.get('/favicon.svg', (c) => {
    return new Response(faviconSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  })

  // Serve files from R2 storage (public file access)
  app.get('/files/*', async (c) => {
    try {
      // Extract the path from the URL pathname (everything after /files/)
      const url = new URL(c.req.url)
      const pathname = url.pathname

      // Remove the /files/ prefix to get the R2 object key
      const objectKey = pathname.replace(/^\/files\//, '')

      if (!objectKey) {
        return c.notFound()
      }

      // Get file from R2
      const object = await c.env.MEDIA_BUCKET.get(objectKey)

      if (!object) {
        return c.notFound()
      }

      // Set appropriate headers
      const headers = new Headers()
      object.httpMetadata?.contentType && headers.set('Content-Type', object.httpMetadata.contentType)
      object.httpMetadata?.contentDisposition && headers.set('Content-Disposition', object.httpMetadata.contentDisposition)
      headers.set('Cache-Control', 'public, max-age=31536000') // 1 year cache
      headers.set('Access-Control-Allow-Origin', '*') // Allow CORS for media files
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
      headers.set('Access-Control-Allow-Headers', 'Content-Type')

      return new Response(object.body as any, {
        headers
      })
    } catch (error) {
      console.error('Error serving file:', error)
      return c.notFound()
    }
  })

  // Custom routes - User-defined routes
  if (config.routes) {
    for (const route of config.routes) {
      app.route(route.path, route.handler)
    }
  }

  // Root redirect to login
  app.get('/', (c) => {
    return c.redirect('/auth/login')
  })

  // Health check
  app.get('/health', (c) => {
    return c.json({
      name: appName,
      version: appVersion,
      status: 'running',
      timestamp: new Date().toISOString()
    })
  })

  // 404 handler
  app.notFound((c) => {
    return c.json({ error: 'Not Found', status: 404 }, 404)
  })

  // Error handler
  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: 'Internal Server Error', status: 500 }, 500)
  })

  return app
}