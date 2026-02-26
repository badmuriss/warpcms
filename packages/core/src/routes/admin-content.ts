import { Hono } from 'hono'
import { html } from 'hono/html'
import type { D1Database } from '@cloudflare/workers-types'
import { requireAuth } from '../middleware'
import { renderContentFormPage, ContentFormData } from '../templates/pages/admin-content-form.template'
import { renderContentListPage, ContentListPageData } from '../templates/pages/admin-content-list.template'
import { getCacheService, CACHE_CONFIGS } from '../services/cache'
import type { Bindings, Variables } from '../app'
import { getContentType, getAllContentTypes, CONTENT_TYPES } from '../content-types'
import type { ContentType, ContentTypeField } from '../content-types'

const adminContentRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Apply authentication middleware
adminContentRoutes.use('*', requireAuth())

/**
 * Extract field data from form submission based on content type fields.
 * For file fields, the actual file URL is stored (uploaded separately via /api/media).
 */
function extractFormData(
  fields: ContentTypeField[],
  formData: FormData
): { data: Record<string, any>; errors: Record<string, string[]> } {
  const data: Record<string, any> = {}
  const errors: Record<string, string[]> = {}

  for (const field of fields) {
    const value = formData.get(field.name)

    if (field.type === 'tags') {
      // Tags are comma-separated
      data[field.name] = value ? String(value).split(',').map(t => t.trim()).filter(Boolean) : []
    } else if (field.type === 'file') {
      // File field stores the URL from the upload (set via JS after upload)
      data[field.name] = value ? String(value) : ''
    } else {
      data[field.name] = value ? String(value) : ''
    }

    // Validate required fields
    if (field.required) {
      const val = data[field.name]
      const isEmpty = val === '' || val === null || val === undefined ||
        (Array.isArray(val) && val.length === 0)
      if (isEmpty) {
        errors[field.name] = [`${field.label} is required`]
      }
    }
  }

  return { data, errors }
}

// ---------------------------------------------------------------------------
// Content list (main page)
// ---------------------------------------------------------------------------
adminContentRoutes.get('/', async (c) => {
  try {
    const user = c.get('user')
    const url = new URL(c.req.url)
    const db = c.env.DB

    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const typeName = url.searchParams.get('type') || 'all'
    const status = url.searchParams.get('status') || 'all'
    const search = url.searchParams.get('search') || ''
    const offset = (page - 1) * limit

    // Build where conditions - no JOIN on collections, use collection_id as type name
    const conditions: string[] = []
    const params: any[] = []

    if (status !== 'deleted') {
      conditions.push("c.status != 'deleted'")
    }

    if (search) {
      conditions.push('(c.title LIKE ? OR c.slug LIKE ? OR c.data LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (typeName !== 'all') {
      conditions.push('c.collection_id = ?')
      params.push(typeName)
    }

    if (status !== 'all' && status !== 'deleted') {
      conditions.push('c.status = ?')
      params.push(status)
    } else if (status === 'deleted') {
      conditions.push("c.status = 'deleted'")
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM content c ${whereClause}`)
    const countResult = await countStmt.bind(...params).first() as any
    const totalItems = countResult?.count || 0

    // Get content items
    const contentStmt = db.prepare(`
      SELECT c.id, c.title, c.slug, c.status, c.collection_id, c.created_at, c.updated_at,
             u.first_name, u.last_name, u.email as author_email
      FROM content c
      LEFT JOIN users u ON c.author_id = u.id
      ${whereClause}
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
    `)
    const { results } = await contentStmt.bind(...params, limit, offset).all()

    const statusConfig: Record<string, { class: string; text: string }> = {
      draft: { class: 'bg-zinc-50 dark:bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 ring-1 ring-inset ring-zinc-600/20 dark:ring-zinc-500/20', text: 'Draft' },
      review: { class: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20 dark:ring-amber-500/20', text: 'Under Review' },
      scheduled: { class: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-600/20 dark:ring-blue-500/20', text: 'Scheduled' },
      published: { class: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/20', text: 'Published' },
      archived: { class: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 ring-1 ring-inset ring-purple-600/20 dark:ring-purple-500/20', text: 'Archived' },
      deleted: { class: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20 dark:ring-red-500/20', text: 'Deleted' },
    }

    const contentItems = (results || []).map((row: any) => {
      const cfg = (statusConfig[row.status] ?? statusConfig.draft)!
      const statusBadge = `<span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${cfg.class}">${cfg.text}</span>`

      const authorName = row.first_name && row.last_name
        ? `${row.first_name} ${row.last_name}`
        : row.author_email || 'Unknown'

      // Resolve display name from content type
      const ct = getContentType(row.collection_id)
      const typeDisplayName = ct?.displayName || row.collection_id || 'Unknown'

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        modelName: typeDisplayName,
        statusBadge,
        authorName,
        formattedDate: new Date(row.updated_at).toLocaleDateString(),
        availableActions: [] as string[],
      }
    })

    // Build type list for filter dropdown
    const types = getAllContentTypes().map(ct => ({
      name: ct.name,
      displayName: ct.displayName,
    }))

    const pageData: ContentListPageData = {
      modelName: typeName,
      status,
      page,
      search,
      models: types,
      contentItems,
      totalItems,
      itemsPerPage: limit,
      user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      version: c.get('appVersion'),
    }

    return c.html(renderContentListPage(pageData))
  } catch (error) {
    console.error('Error fetching content list:', error)
    return c.html(`<p>Error loading content: ${error}</p>`)
  }
})

// ---------------------------------------------------------------------------
// New content - type picker
// ---------------------------------------------------------------------------
adminContentRoutes.get('/new', async (c) => {
  try {
    const user = c.get('user')
    const url = new URL(c.req.url)
    const typeName = url.searchParams.get('type')

    if (!typeName) {
      // Show type picker page
      const types = getAllContentTypes()
      const { renderAdminLayoutCatalyst } = await import('../templates/layouts/admin-layout-catalyst.template')

      const cards = types.map(ct => `
        <a href="/admin/content/new?type=${ct.name}"
           class="group block rounded-xl bg-white dark:bg-zinc-800 p-6 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 hover:ring-cyan-500/50 dark:hover:ring-cyan-400/50 hover:shadow-md transition-all">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              ${ct.icon}
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-950 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">${ct.displayName}</h3>
              <p class="text-sm text-zinc-500 dark:text-zinc-400">${ct.description}</p>
            </div>
          </div>
        </a>
      `).join('')

      const pageContent = `
        <div class="mb-6">
          <a href="/admin/content" class="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Back to Content
          </a>
        </div>
        <div class="mb-8">
          <h1 class="text-2xl font-semibold text-zinc-950 dark:text-white">Create New Content</h1>
          <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Choose a content type to get started</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          ${cards}
        </div>
      `

      return c.html(renderAdminLayoutCatalyst({
        title: 'New Content',
        currentPath: '/admin/content',
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
        version: c.get('appVersion'),
        content: pageContent,
      }))
    }

    const contentType = getContentType(typeName)
    if (!contentType) {
      return c.html(renderContentFormPage({
        contentType: { name: 'unknown', displayName: 'Unknown', description: '', icon: '', fields: [] },
        error: 'Content type not found.',
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      }))
    }

    return c.html(renderContentFormPage({
      contentType,
      isEdit: false,
      user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      version: c.get('appVersion'),
    }))
  } catch (error) {
    console.error('Error loading new content form:', error)
    return c.html(renderContentFormPage({
      contentType: { name: 'unknown', displayName: 'Unknown', description: '', icon: '', fields: [] },
      error: 'Failed to load content form.',
      user: c.get('user') ? { name: c.get('user')!.email, email: c.get('user')!.email, role: c.get('user')!.role } : undefined,
    }))
  }
})

// ---------------------------------------------------------------------------
// Edit content form
// ---------------------------------------------------------------------------
adminContentRoutes.get('/:id/edit', async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')
    const db = c.env.DB
    const url = new URL(c.req.url)
    const referrerParams = url.searchParams.get('ref') || ''

    const cache = getCacheService(CACHE_CONFIGS.content!)
    const content = await cache.getOrSet(
      cache.generateKey('content', id),
      async () => {
        const stmt = db.prepare('SELECT * FROM content WHERE id = ?')
        return await stmt.bind(id).first() as any
      }
    )

    if (!content) {
      return c.html(renderContentFormPage({
        contentType: { name: 'unknown', displayName: 'Unknown', description: '', icon: '', fields: [] },
        error: 'Content not found.',
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      }))
    }

    // Resolve content type from collection_id
    const contentType = getContentType(content.collection_id) || {
      name: content.collection_id || 'unknown',
      displayName: content.collection_id || 'Unknown',
      description: '',
      icon: '',
      fields: [],
    }

    const contentData = content.data ? JSON.parse(content.data) : {}

    return c.html(renderContentFormPage({
      id: content.id,
      title: content.title,
      slug: content.slug,
      data: contentData,
      status: content.status,
      contentType,
      isEdit: true,
      referrerParams,
      user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      version: c.get('appVersion'),
    }))
  } catch (error) {
    console.error('Error loading edit content form:', error)
    return c.html(renderContentFormPage({
      contentType: { name: 'unknown', displayName: 'Unknown', description: '', icon: '', fields: [] },
      error: 'Failed to load content for editing.',
      user: c.get('user') ? { name: c.get('user')!.email, email: c.get('user')!.email, role: c.get('user')!.role } : undefined,
    }))
  }
})

// ---------------------------------------------------------------------------
// Create content
// ---------------------------------------------------------------------------
adminContentRoutes.post('/', async (c) => {
  try {
    const user = c.get('user')
    const formData = await c.req.formData()
    const typeName = formData.get('content_type') as string
    const action = formData.get('action') as string

    const contentType = getContentType(typeName)
    if (!contentType) {
      return c.html(html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Invalid content type.</div>`)
    }

    const db = c.env.DB
    const { data, errors } = extractFormData(contentType.fields, formData)

    if (Object.keys(errors).length > 0) {
      return c.html(renderContentFormPage({
        contentType,
        data,
        validationErrors: errors,
        error: 'Please fix the validation errors below.',
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      }))
    }

    // Generate slug
    let slug = (data.title || 'untitled').toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    let status = formData.get('status') as string || 'draft'
    if (action === 'save_and_publish') status = 'published'

    const contentId = crypto.randomUUID()
    const now = Date.now()

    await db.prepare(`
      INSERT INTO content (id, collection_id, slug, title, data, status, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(contentId, typeName, slug, data.title || 'Untitled', JSON.stringify(data), status, user?.userId || 'unknown', now, now).run()

    // Invalidate cache
    const cache = getCacheService(CACHE_CONFIGS.content!)
    await cache.invalidate('content:list:*')

    // Log workflow
    await db.prepare(`
      INSERT INTO workflow_history (id, content_id, action, from_status, to_status, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), contentId, 'created', 'none', status, user?.userId || 'unknown', now).run()

    const referrerParams = formData.get('referrer_params') as string
    const redirectUrl = action === 'save_and_continue'
      ? `/admin/content/${contentId}/edit?success=Content saved successfully!${referrerParams ? `&ref=${encodeURIComponent(referrerParams)}` : ''}`
      : referrerParams
        ? `/admin/content?${referrerParams}&success=Content created successfully!`
        : `/admin/content?type=${typeName}&success=Content created successfully!`

    const isHTMX = c.req.header('HX-Request') === 'true'
    return isHTMX
      ? c.text('', 200, { 'HX-Redirect': redirectUrl })
      : c.redirect(redirectUrl)
  } catch (error) {
    console.error('Error creating content:', error)
    return c.html(html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Failed to create content. Please try again.</div>`)
  }
})

// ---------------------------------------------------------------------------
// Update content
// ---------------------------------------------------------------------------
adminContentRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')
    const formData = await c.req.formData()
    const action = formData.get('action') as string

    const db = c.env.DB

    const existingContent = await db.prepare('SELECT * FROM content WHERE id = ?').bind(id).first() as any
    if (!existingContent) {
      return c.html(html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Content not found.</div>`)
    }

    const contentType = getContentType(existingContent.collection_id)
    if (!contentType) {
      return c.html(html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Content type not found.</div>`)
    }

    const { data, errors } = extractFormData(contentType.fields, formData)

    if (Object.keys(errors).length > 0) {
      return c.html(renderContentFormPage({
        id,
        contentType,
        data,
        validationErrors: errors,
        error: 'Please fix the validation errors below.',
        isEdit: true,
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      }))
    }

    let slug = (data.title || 'untitled').toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    let status = formData.get('status') as string || existingContent.status
    if (action === 'save_and_publish') status = 'published'

    const now = Date.now()

    await db.prepare(`
      UPDATE content SET slug = ?, title = ?, data = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).bind(slug, data.title || 'Untitled', JSON.stringify(data), status, now, id).run()

    // Invalidate cache
    const cache = getCacheService(CACHE_CONFIGS.content!)
    await cache.delete(cache.generateKey('content', id))
    await cache.invalidate('content:list:*')

    // Log workflow if status changed
    if (status !== existingContent.status) {
      await db.prepare(`
        INSERT INTO workflow_history (id, content_id, action, from_status, to_status, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(crypto.randomUUID(), id, 'status_changed', existingContent.status, status, user?.userId || 'unknown', now).run()
    }

    const referrerParams = formData.get('referrer_params') as string
    const redirectUrl = action === 'save_and_continue'
      ? `/admin/content/${id}/edit?success=Content updated successfully!${referrerParams ? `&ref=${encodeURIComponent(referrerParams)}` : ''}`
      : referrerParams
        ? `/admin/content?${referrerParams}&success=Content updated successfully!`
        : `/admin/content?type=${existingContent.collection_id}&success=Content updated successfully!`

    const isHTMX = c.req.header('HX-Request') === 'true'
    return isHTMX
      ? c.text('', 200, { 'HX-Redirect': redirectUrl })
      : c.redirect(redirectUrl)
  } catch (error) {
    console.error('Error updating content:', error)
    return c.html(html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Failed to update content. Please try again.</div>`)
  }
})

// ---------------------------------------------------------------------------
// Duplicate content
// ---------------------------------------------------------------------------
adminContentRoutes.post('/duplicate', async (c) => {
  try {
    const user = c.get('user')
    const formData = await c.req.formData()
    const originalId = formData.get('id') as string
    if (!originalId) return c.json({ success: false, error: 'Content ID required' })

    const db = c.env.DB
    const original = await db.prepare('SELECT * FROM content WHERE id = ?').bind(originalId).first() as any
    if (!original) return c.json({ success: false, error: 'Content not found' })

    const newId = crypto.randomUUID()
    const now = Date.now()
    const originalData = JSON.parse(original.data || '{}')
    originalData.title = `${originalData.title || 'Untitled'} (Copy)`

    await db.prepare(`
      INSERT INTO content (id, collection_id, slug, title, data, status, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(newId, original.collection_id, `${original.slug}-copy-${Date.now()}`, originalData.title, JSON.stringify(originalData), 'draft', user?.userId || 'unknown', now, now).run()

    return c.json({ success: true, id: newId })
  } catch (error) {
    console.error('Error duplicating content:', error)
    return c.json({ success: false, error: 'Failed to duplicate content' })
  }
})

// ---------------------------------------------------------------------------
// Bulk action
// ---------------------------------------------------------------------------
adminContentRoutes.post('/bulk-action', async (c) => {
  try {
    const body = await c.req.json()
    const { action, ids } = body
    if (!action || !ids || ids.length === 0) return c.json({ success: false, error: 'Action and IDs required' })

    const db = c.env.DB
    const now = Date.now()
    const placeholders = ids.map(() => '?').join(',')

    if (action === 'delete') {
      await db.prepare(`UPDATE content SET status = 'deleted', updated_at = ? WHERE id IN (${placeholders})`).bind(now, ...ids).run()
    } else if (action === 'publish' || action === 'draft') {
      const publishedAt = action === 'publish' ? now : null
      await db.prepare(`UPDATE content SET status = ?, published_at = ?, updated_at = ? WHERE id IN (${placeholders})`).bind(action, publishedAt, now, ...ids).run()
    } else {
      return c.json({ success: false, error: 'Invalid action' })
    }

    const cache = getCacheService(CACHE_CONFIGS.content!)
    for (const contentId of ids) {
      await cache.delete(cache.generateKey('content', contentId))
    }
    await cache.invalidate('content:list:*')

    return c.json({ success: true, count: ids.length })
  } catch (error) {
    console.error('Bulk action error:', error)
    return c.json({ success: false, error: 'Failed to perform bulk action' })
  }
})

// ---------------------------------------------------------------------------
// Delete content (soft)
// ---------------------------------------------------------------------------
adminContentRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.DB

    const content = await db.prepare('SELECT id FROM content WHERE id = ?').bind(id).first() as any
    if (!content) return c.json({ success: false, error: 'Content not found' }, 404)

    const now = Date.now()
    await db.prepare(`UPDATE content SET status = 'deleted', updated_at = ? WHERE id = ?`).bind(now, id).run()

    const cache = getCacheService(CACHE_CONFIGS.content!)
    await cache.delete(cache.generateKey('content', id))
    await cache.invalidate('content:list:*')

    return c.html(`
      <div id="content-list" hx-get="/admin/content" hx-trigger="load" hx-swap="outerHTML">
        <div class="flex items-center justify-center p-8">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-lime-500 dark:text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Content deleted successfully. Refreshing...</p>
          </div>
        </div>
      </div>
    `)
  } catch (error) {
    console.error('Delete content error:', error)
    return c.json({ success: false, error: 'Failed to delete content' }, 500)
  }
})

export default adminContentRoutes
