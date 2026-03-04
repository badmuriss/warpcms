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

// --- Server Error (allows details as string or string[]) ---

export const ServerErrorSchema = z.object({
  error: z.string(),
  details: z.union([z.string(), z.array(z.string())]).optional(),
})

export type ServerError = z.infer<typeof ServerErrorSchema>
