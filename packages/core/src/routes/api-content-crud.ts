import { Hono } from 'hono'
import { requireAuth } from '../middleware'
import { getCacheService, CACHE_CONFIGS } from '../services'
import { getContentType } from '../content-types'
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

const apiContentCrudRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/content/check-slug - Check if slug is available (globally unique)
// Query params: slug, excludeId (optional - when editing)
// NOTE: This MUST come before /:id route to avoid route conflict
apiContentCrudRoutes.get('/check-slug', async (c) => {
  try {
    const db = c.env.DB
    const slug = c.req.query('slug')
    const excludeId = c.req.query('excludeId') // When editing, exclude current item

    if (!slug) {
      return c.json({ error: 'slug is required' }, 400)
    }

    // Check for existing content with this slug (globally unique)
    let query = 'SELECT id FROM content WHERE slug = ?'
    const params: string[] = [slug]

    if (excludeId) {
      query += ' AND id != ?'
      params.push(excludeId)
    }

    const existing = await db.prepare(query).bind(...params).first()

    if (existing) {
      return c.json({
        available: false,
        message: 'This URL slug is already in use'
      })
    }

    return c.json({ available: true })
  } catch (error: unknown) {
    console.error('Error checking slug:', error)
    return c.json({
      error: 'Failed to check slug availability',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// GET /api/content/by-slug/:slug - Get single content item by slug (globally unique)
// NOTE: This MUST come before /:id route to avoid route conflict
apiContentCrudRoutes.get('/by-slug/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const db = c.env.DB

    const cache = getCacheService(CACHE_CONFIGS.api!)
    const cacheKey = `content:by-slug:${slug}`

    const cached = await cache.get(cacheKey)
    if (cached) {
      return c.json({ data: cached })
    }

    const stmt = db.prepare('SELECT * FROM content WHERE slug = ?')
    const content = await stmt.bind(slug).first()

    if (!content) {
      return c.json({ error: 'Content not found' }, 404)
    }

    const flatContent = flattenContent(content)

    await cache.set(cacheKey, flatContent)

    return c.json({ data: flatContent })
  } catch (error) {
    console.error('Error fetching content by slug:', error)
    return c.json({
      error: 'Failed to fetch content',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// GET /api/content/:id - Get single content item by ID
apiContentCrudRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.DB

    const stmt = db.prepare('SELECT * FROM content WHERE id = ?')
    const content = await stmt.bind(id).first()

    if (!content) {
      return c.json({ error: 'Content not found' }, 404)
    }

    return c.json({ data: flattenContent(content) })
  } catch (error) {
    console.error('Error fetching content:', error)
    return c.json({
      error: 'Failed to fetch content',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// POST /api/content - Create new content (requires authentication)
apiContentCrudRoutes.post('/', requireAuth(), async (c) => {
  try {
    const db = c.env.DB
    const user = c.get('user')
    const body = await c.req.json()

    const { collectionId, title, slug, data } = body

    // Validate required fields
    if (!collectionId) {
      return c.json({ error: 'collectionId is required' }, 400)
    }

    if (!title) {
      return c.json({ error: 'title is required' }, 400)
    }

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

// PUT /api/content/:id - Update content (requires authentication)
apiContentCrudRoutes.put('/:id', requireAuth(), async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.DB
    const body = await c.req.json()

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
    })
  } catch (error) {
    console.error('Error updating content:', error)
    return c.json({
      error: 'Failed to update content',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// DELETE /api/content/:id - Delete content (requires authentication)
apiContentCrudRoutes.delete('/:id', requireAuth(), async (c) => {
  try {
    const id = c.req.param('id')
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

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting content:', error)
    return c.json({
      error: 'Failed to delete content',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

export default apiContentCrudRoutes
