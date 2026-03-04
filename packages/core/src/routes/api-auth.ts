import { createRoute, z } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { createOpenAPIApp } from './openapi-app'
import { AuthManager, requireAuth } from '../middleware/auth'
import {
  ErrorResponseSchema,
  TokenResponseSchema,
  UserResponseSchema,
} from '../schemas/api-schemas'

const apiAuthRoutes = createOpenAPIApp()

// CORS middleware
apiAuthRoutes.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// --- POST /token ---

const LoginBodySchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

const postTokenRoute = createRoute({
  method: 'post',
  path: '/token',
  tags: ['Auth'],
  summary: 'Obtain a JWT access token',
  request: {
    body: {
      content: {
        'application/json': { schema: LoginBodySchema },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: TokenResponseSchema } },
      description: 'JWT token issued successfully',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Validation error',
    },
    401: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Invalid credentials',
    },
  },
})

apiAuthRoutes.openapi(postTokenRoute, async (c) => {
  const { email, password } = c.req.valid('json')
  const db = c.env.DB

  const normalizedEmail = email.toLowerCase()

  const user = (await db
    .prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
    .bind(normalizedEmail)
    .first()) as {
    id: string
    email: string
    username: string
    first_name: string
    last_name: string
    password_hash: string
    role: string
  } | null

  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const isValid = await AuthManager.verifyPassword(password, user.password_hash)
  if (!isValid) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const token = await AuthManager.generateToken(user.id, user.email, user.role)

  return c.json(
    {
      token,
      expires_in: 86400,
      token_type: 'Bearer' as const,
    },
    200
  )
})

// --- GET /me ---

const getMeRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Auth'],
  summary: 'Get current authenticated user info',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ user: UserResponseSchema }),
        },
      },
      description: 'Current user info',
    },
    401: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Missing or invalid token',
    },
  },
})

apiAuthRoutes.use('/me', requireAuth())

apiAuthRoutes.openapi(getMeRoute, async (c) => {
  const jwtPayload = c.get('user') as { userId: string; email: string; role: string }
  const db = c.env.DB

  const user = (await db
    .prepare('SELECT id, email, username, first_name, last_name, role FROM users WHERE id = ?')
    .bind(jwtPayload.userId)
    .first()) as {
    id: string
    email: string
    username: string
    first_name: string
    last_name: string
    role: string
  } | null

  if (!user) {
    return c.json({ error: 'User not found' }, 401)
  }

  return c.json(
    {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    },
    200
  )
})

export { apiAuthRoutes }
