import { z } from 'zod'

// --- Error Responses ---

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.array(z.string()).optional(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// --- Auth Responses ---

export const TokenResponseSchema = z.object({
  token: z.string(),
  expires_in: z.number().int(),
  token_type: z.literal('Bearer'),
})

export type TokenResponse = z.infer<typeof TokenResponseSchema>

// --- User ---

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string(),
})

export type UserResponse = z.infer<typeof UserResponseSchema>

// --- Content ---

export const ContentItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  collectionId: z.string(),
  data: z.unknown(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type ContentItem = z.infer<typeof ContentItemSchema>

// --- Flat Content (public API shape from flattenContent) ---

export const FlatContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  contentType: z.string(),
  value: z.unknown(),
  meta: z.record(z.string(), z.unknown()),
  created_at: z.unknown(),
  updated_at: z.unknown(),
})

export type FlatContent = z.infer<typeof FlatContentSchema>

// --- Content Mutation Response (create/update shape) ---

export const ContentMutationSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  contentType: z.string(),
  data: z.unknown(),
  created_at: z.number(),
  updated_at: z.number(),
})

export type ContentMutation = z.infer<typeof ContentMutationSchema>

// --- Media ---

export const MediaItemSchema = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  folder: z.string(),
  r2Key: z.string(),
  publicUrl: z.string(),
  thumbnailUrl: z.string().nullable(),
  uploadedAt: z.string(),
})

export type MediaItem = z.infer<typeof MediaItemSchema>

export const MediaUploadResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  filename: z.string(),
  size: z.number().int(),
  type: z.string(),
  file: MediaItemSchema,
})

export type MediaUploadResponse = z.infer<typeof MediaUploadResponseSchema>

// --- Health Check (GET /api/health) ---

export const HealthCheckSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  schemas: z.array(z.string()),
})

export type HealthCheck = z.infer<typeof HealthCheckSchema>

// --- System Health (GET /api/system/health) ---

const ServiceCheckSchema = z.object({
  status: z.string(),
  latency: z.number().int().optional(),
})

export const SystemHealthSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  uptime: z.number().int(),
  checks: z.object({
    database: ServiceCheckSchema,
    cache: ServiceCheckSchema,
    storage: z.object({ status: z.string() }),
  }),
  environment: z.string(),
})

export type SystemHealth = z.infer<typeof SystemHealthSchema>

export const SystemHealthErrorSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  error: z.string(),
})

// --- System Info (GET /api/system/info) ---

export const SystemInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  endpoints: z.record(z.string(), z.string()),
  features: z.record(z.string(), z.boolean()),
  timestamp: z.string(),
})

export type SystemInfo = z.infer<typeof SystemInfoSchema>

// --- System Stats (GET /api/system/stats) ---

export const SystemStatsSchema = z.object({
  content: z.object({ total: z.number().int() }),
  media: z.object({
    total_files: z.number().int(),
    total_size_bytes: z.number(),
    total_size_mb: z.number(),
  }),
  users: z.object({ total: z.number().int() }),
  timestamp: z.string(),
})

export type SystemStats = z.infer<typeof SystemStatsSchema>

// --- Server Error (allows details as string or string[]) ---

export const ServerErrorSchema = z.object({
  error: z.string(),
  details: z.union([z.string(), z.array(z.string())]).optional(),
})

export type ServerError = z.infer<typeof ServerErrorSchema>
