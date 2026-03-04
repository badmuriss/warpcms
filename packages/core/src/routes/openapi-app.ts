import { OpenAPIHono } from '@hono/zod-openapi'
import type { Bindings, Variables } from '../app'

type AppEnv = { Bindings: Bindings; Variables: Variables }

/**
 * Create an OpenAPIHono app instance pre-configured with WarpCMS API metadata.
 * All routes registered on the returned app contribute to the auto-generated spec.
 */
export function createOpenAPIApp() {
  const app = new OpenAPIHono<AppEnv>()

  // Register bearerAuth security scheme
  app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  })

  return app
}

/** OpenAPI document metadata used when generating the spec */
export const openAPIDocInfo = {
  title: 'WarpCMS API',
  version: '0.1.0',
  description:
    'RESTful API for WarpCMS headless CMS - a modern, edge-first content management system built on Cloudflare Workers',
  contact: {
    name: 'WarpCMS Support',
    email: 'support@warpcms.dev',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
} as const

/** Tags used across API route definitions */
export const openAPITags = [
  { name: 'Auth', description: 'Authentication endpoints' },
  { name: 'Content', description: 'Content management operations' },
  { name: 'Media', description: 'Media file operations' },
  { name: 'System', description: 'System and health endpoints' },
] as const
