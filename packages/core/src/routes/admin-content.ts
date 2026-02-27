import { Hono } from 'hono'
import { html } from 'hono/html'
import { requireAuth } from '../middleware'
import { renderContentFormPage } from '../templates/pages/admin-content-form.template'
import { renderContentListPage, ContentListPageData } from '../templates/pages/admin-content-list.template'
import { renderAlert } from '../templates/components/alert.template'
import { getCacheService, CACHE_CONFIGS } from '../services/cache'
import type { Bindings, Variables } from '../app'
import { getContentType, getAllContentTypes, localizeContentType } from '../content-types'
import type { ContentTypeField } from '../content-types'
import { getLocale, t } from '../i18n'

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
    const locale = await getLocale(c)
    const url = new URL(c.req.url)
    const db = c.env.DB

    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const typeName = url.searchParams.get('type') || 'all'
    const search = url.searchParams.get('search') || ''
    const successMessage = url.searchParams.get('success') || ''
    const offset = (page - 1) * limit

    // Build where conditions - no JOIN on collections, use collection_id as type name
    const conditions: string[] = []
    const params: any[] = []

    if (search) {
      conditions.push('(c.title LIKE ? OR c.slug LIKE ? OR c.data LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (typeName !== 'all') {
      conditions.push('c.collection_id = ?')
      params.push(typeName)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM content c ${whereClause}`)
    const countResult = await countStmt.bind(...params).first() as any
    const totalItems = countResult?.count || 0

    // Get content items
    const contentStmt = db.prepare(`
      SELECT c.id, c.title, c.slug, c.collection_id, c.data, c.created_at, c.updated_at,
             u.first_name, u.last_name, u.email as author_email
      FROM content c
      LEFT JOIN users u ON c.author_id = u.id
      ${whereClause}
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
    `)
    const { results } = await contentStmt.bind(...params, limit, offset).all()

    const contentItems = (results || []).map((row: any) => {
      const authorName = row.first_name && row.last_name
        ? `${row.first_name} ${row.last_name}`
        : row.author_email || 'Unknown'

      // Resolve display name from content type
      const rawCt = getContentType(row.collection_id)
      const ct = rawCt ? localizeContentType(rawCt, t, locale) : undefined
      const typeDisplayName = ct?.displayName || row.collection_id || 'Unknown'

      // Generate preview from data
      let preview = ''
      try {
        const parsed = row.data ? JSON.parse(row.data) : {}
        if (row.collection_id === 'text') {
          const text = parsed.content || parsed.body || parsed.text || ''
          preview = text.length > 120 ? text.substring(0, 120) + '...' : text
        } else if (row.collection_id === 'image' || row.collection_id === 'file') {
          const url = parsed.url || parsed.file || parsed.src || ''
          preview = url ? url.split('/').pop() || url : ''
        }
      } catch { /* ignore parse errors */ }

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        modelName: typeDisplayName,
        preview,
        authorName,
        formattedDate: new Date(row.updated_at).toLocaleDateString(),
        availableActions: [] as string[],
      }
    })

    // Build type list for filter dropdown
    const types = getAllContentTypes().map(raw => {
      const loc = localizeContentType(raw, t, locale)
      return { name: loc.name, displayName: loc.displayName }
    })

    const pageData: ContentListPageData = {
      modelName: typeName,
      page,
      search,
      models: types,
      contentItems,
      totalItems,
      itemsPerPage: limit,
      successMessage,
      user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      version: c.get('appVersion'),
      locale,
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
    const locale = await getLocale(c)
    const url = new URL(c.req.url)
    const typeName = url.searchParams.get('type')

    if (!typeName) {
      // Show type picker page
      const types = getAllContentTypes().map(raw => localizeContentType(raw, t, locale))
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
            ${t('content.form.backToContent', locale)}
          </a>
        </div>
        <div class="mb-8">
          <h1 class="text-2xl font-semibold text-zinc-950 dark:text-white">${t('content.form.createNewContentPage', locale)}</h1>
          <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">${t('content.form.chooseContentType', locale)}</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          ${cards}
        </div>
      `

      return c.html(renderAdminLayoutCatalyst({
        title: t('content.form.newContent', locale),
        currentPath: '/admin/content',
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
        version: c.get('appVersion'),
        content: pageContent,
        locale,
      }))
    }

    const rawContentType = getContentType(typeName)
    if (!rawContentType) {
      return c.html(renderContentFormPage({
        contentType: { name: 'unknown', displayName: 'Unknown', description: '', icon: '', primaryField: '', fields: [] },
        error: 'Content type not found.',
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
        locale,
      }))
    }

    return c.html(renderContentFormPage({
      contentType: localizeContentType(rawContentType, t, locale),
      isEdit: false,
      user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      version: c.get('appVersion'),
      locale,
    }))
  } catch (error) {
    console.error('Error loading new content form:', error)
    const fallbackLocale = await getLocale(c)
    return c.html(renderContentFormPage({
      contentType: { name: 'unknown', displayName: 'Unknown', description: '', icon: '', primaryField: '', fields: [] },
      error: 'Failed to load content form.',
      user: c.get('user') ? { name: c.get('user')!.email, email: c.get('user')!.email, role: c.get('user')!.role } : undefined,
      locale: fallbackLocale,
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
    const locale = await getLocale(c)
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
        contentType: { name: 'unknown', displayName: 'Unknown', description: '', icon: '', primaryField: '', fields: [] },
        error: 'Content not found.',
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
        locale,
      }))
    }

    // Resolve content type from collection_id
    const rawCt = getContentType(content.collection_id)
    const contentType = rawCt ? localizeContentType(rawCt, t, locale) : {
      name: content.collection_id || 'unknown',
      displayName: content.collection_id || 'Unknown',
      description: '',
      icon: '',
      primaryField: '',
      fields: [],
    }

    const contentData = content.data ? JSON.parse(content.data) : {}

    return c.html(renderContentFormPage({
      id: content.id,
      title: content.title,
      slug: content.slug,
      data: contentData,
      contentType,
      isEdit: true,
      referrerParams,
      user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      version: c.get('appVersion'),
      locale,
    }))
  } catch (error) {
    console.error('Error loading edit content form:', error)
    const fallbackLocale = await getLocale(c)
    return c.html(renderContentFormPage({
      contentType: { name: 'unknown', displayName: 'Unknown', description: '', icon: '', primaryField: '', fields: [] },
      error: 'Failed to load content for editing.',
      user: c.get('user') ? { name: c.get('user')!.email, email: c.get('user')!.email, role: c.get('user')!.role } : undefined,
      locale: fallbackLocale,
    }))
  }
})

// ---------------------------------------------------------------------------
// Create content
// ---------------------------------------------------------------------------
adminContentRoutes.post('/', async (c) => {
  try {
    const user = c.get('user')
    const locale = await getLocale(c)
    const formData = await c.req.formData()
    const typeName = formData.get('content_type') as string

    const rawCType = getContentType(typeName)
    if (!rawCType) {
      return c.html(html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Invalid content type.</div>`)
    }
    const contentType = localizeContentType(rawCType, t, locale)

    const db = c.env.DB
    const { data, errors } = extractFormData(contentType.fields, formData)

    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).flat().join('. ')
      const isHTMX = c.req.header('HX-Request') === 'true'
      if (isHTMX) {
        return c.html(renderAlert({ type: 'error', message: errorMessages, dismissible: true }))
      }
      return c.html(renderContentFormPage({
        contentType,
        data,
        validationErrors: errors,
        error: 'Please fix the validation errors below.',
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
        locale,
      }))
    }

    // Use provided slug or generate from title
    const rawSlug = (formData.get('slug') as string) || (data.title || 'untitled')
    let slug = rawSlug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    // Check for duplicate slug (globally unique)
    const slugExists = await db.prepare('SELECT id FROM content WHERE slug = ?').bind(slug).first()
    if (slugExists) {
      const errorMsg = 'A content item with this slug already exists. Please choose a different slug.'
      const isHTMX = c.req.header('HX-Request') === 'true'
      if (isHTMX) {
        return c.html(renderAlert({ type: 'error', message: errorMsg, dismissible: true }))
      }
      return c.html(renderContentFormPage({
        contentType,
        title: data.title,
        slug,
        data,
        error: errorMsg,
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      }))
    }

    const contentId = crypto.randomUUID()
    const now = Date.now()

    await db.prepare(`
      INSERT INTO content (id, collection_id, slug, title, data, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(contentId, typeName, slug, data.title || 'Untitled', JSON.stringify(data), user?.userId || 'unknown', now, now).run()

    // Invalidate cache
    const cache = getCacheService(CACHE_CONFIGS.content!)
    await cache.invalidate('content:list:*')

    const referrerParams = formData.get('referrer_params') as string
    const redirectUrl = referrerParams
      ? `/admin/content?${referrerParams}&success=Content+created+successfully`
      : `/admin/content?success=Content+created+successfully`

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
    const locale = await getLocale(c)
    const formData = await c.req.formData()

    const db = c.env.DB

    const existingContent = await db.prepare('SELECT * FROM content WHERE id = ?').bind(id).first() as any
    if (!existingContent) {
      return c.html(html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Content not found.</div>`)
    }

    const rawCtPut = getContentType(existingContent.collection_id)
    if (!rawCtPut) {
      return c.html(html`<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Content type not found.</div>`)
    }
    const contentType = localizeContentType(rawCtPut, t, locale)

    const { data, errors } = extractFormData(contentType.fields, formData)

    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).flat().join('. ')
      const isHTMX = c.req.header('HX-Request') === 'true'
      if (isHTMX) {
        return c.html(renderAlert({ type: 'error', message: errorMessages, dismissible: true }))
      }
      return c.html(renderContentFormPage({
        id,
        contentType,
        data,
        validationErrors: errors,
        error: 'Please fix the validation errors below.',
        isEdit: true,
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
        locale,
      }))
    }

    // Use provided slug or generate from title
    const rawSlug = (formData.get('slug') as string) || (data.title || 'untitled')
    let slug = rawSlug.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    // Check for duplicate slug (globally unique, excluding current item)
    const slugExists = await db.prepare('SELECT id FROM content WHERE slug = ? AND id != ?').bind(slug, id).first()
    if (slugExists) {
      const errorMsg = 'A content item with this slug already exists. Please choose a different slug.'
      const isHTMX = c.req.header('HX-Request') === 'true'
      if (isHTMX) {
        return c.html(renderAlert({ type: 'error', message: errorMsg, dismissible: true }))
      }
      return c.html(renderContentFormPage({
        id,
        contentType,
        title: data.title,
        slug,
        data,
        error: errorMsg,
        isEdit: true,
        user: user ? { name: user.email, email: user.email, role: user.role } : undefined,
      }))
    }

    const now = Date.now()

    await db.prepare(`
      UPDATE content SET slug = ?, title = ?, data = ?, updated_at = ?
      WHERE id = ?
    `).bind(slug, data.title || 'Untitled', JSON.stringify(data), now, id).run()

    // Invalidate cache
    const cache = getCacheService(CACHE_CONFIGS.content!)
    await cache.delete(cache.generateKey('content', id))
    await cache.invalidate('content:list:*')

    const referrerParams = formData.get('referrer_params') as string
    const redirectUrl = referrerParams
      ? `/admin/content?${referrerParams}&success=Content+updated+successfully`
      : `/admin/content?type=${existingContent.collection_id}&success=Content+updated+successfully`

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
// Delete content (hard delete)
// ---------------------------------------------------------------------------
adminContentRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const db = c.env.DB

    const content = await db.prepare('SELECT id FROM content WHERE id = ?').bind(id).first() as any
    if (!content) return c.json({ success: false, error: 'Content not found' }, 404)

    await db.prepare('DELETE FROM content WHERE id = ?').bind(id).run()

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
