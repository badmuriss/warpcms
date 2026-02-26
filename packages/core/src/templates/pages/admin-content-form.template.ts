import { renderAdminLayoutCatalyst, AdminLayoutCatalystData } from '../layouts/admin-layout-catalyst.template'
import { renderAlert } from '../components/alert.template'
import { renderConfirmationDialog, getConfirmationDialogScript } from '../components/confirmation-dialog.template'
import type { ContentType, ContentTypeField } from '../../content-types'

export interface ContentFormData {
  id?: string
  title?: string
  slug?: string
  data?: any
  contentType: ContentType
  isEdit?: boolean
  error?: string
  success?: string
  validationErrors?: Record<string, string[]>
  referrerParams?: string
  user?: {
    name: string
    email: string
    role: string
  }
  version?: string
  locale?: string;
}

/** Render a single field based on its ContentTypeField definition */
function renderField(field: ContentTypeField, value: any, errors?: string[]): string {
  const errorHTML = errors && errors.length > 0
    ? `<p class="mt-1 text-sm text-red-600 dark:text-red-400">${errors.join(', ')}</p>`
    : ''
  const requiredMark = field.required ? '<span class="text-red-500">*</span>' : ''
  const helpHTML = field.helpText
    ? `<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">${field.helpText}</p>`
    : ''

  const inputClasses = 'w-full rounded-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white shadow-sm ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow'

  switch (field.type) {
    case 'text':
      return `
        <div>
          <label for="field-${field.name}" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">${field.label} ${requiredMark}</label>
          <div class="mt-2">
            <input type="text" id="field-${field.name}" name="${field.name}" value="${escapeAttr(String(value || ''))}"
              placeholder="${escapeAttr(field.placeholder || '')}"
              ${field.required ? 'required' : ''}
              class="${inputClasses}"
            />
          </div>
          ${helpHTML}
          ${errorHTML}
        </div>
      `

    case 'textarea':
      return `
        <div>
          <label for="field-${field.name}" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">${field.label} ${requiredMark}</label>
          <div class="mt-2">
            <textarea id="field-${field.name}" name="${field.name}" rows="8"
              placeholder="${escapeAttr(field.placeholder || '')}"
              ${field.required ? 'required' : ''}
              class="${inputClasses}"
            >${escapeHtml(String(value || ''))}</textarea>
          </div>
          ${helpHTML}
          ${errorHTML}
        </div>
      `

    case 'richtext':
      return `
        <div>
          <label for="field-${field.name}" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">${field.label} ${requiredMark}</label>
          <div class="mt-2">
            <div id="quill-editor-${field.name}" class="quill-editor bg-white dark:bg-zinc-800 rounded-lg ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10" style="min-height: 300px;"></div>
            <input type="hidden" id="field-${field.name}" name="${field.name}" value="${escapeAttr(String(value || ''))}">
          </div>
          ${helpHTML}
          ${errorHTML}
        </div>
      `

    case 'file':
      return `
        <div>
          <label class="block text-sm/6 font-medium text-zinc-950 dark:text-white">${field.label} ${requiredMark}</label>
          <input type="hidden" id="field-${field.name}" name="${field.name}" value="${escapeAttr(String(value || ''))}">
          <div class="mt-2">
            <!-- Preview area -->
            <div id="file-preview-${field.name}" class="${value ? '' : 'hidden'} mb-3">
              ${value ? renderFilePreview(String(value), field.accept) : ''}
            </div>
            <!-- Drop zone -->
            <div id="dropzone-${field.name}"
              class="relative rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 p-6 text-center hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors cursor-pointer"
              ondragover="event.preventDefault(); this.classList.add('border-cyan-500', 'bg-cyan-50/50', 'dark:bg-cyan-500/5')"
              ondragleave="this.classList.remove('border-cyan-500', 'bg-cyan-50/50', 'dark:bg-cyan-500/5')"
              ondrop="handleFileDrop(event, '${field.name}', '${escapeAttr(field.accept || '')}')"
              onclick="document.getElementById('file-input-${field.name}').click()"
            >
              <svg class="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span class="font-semibold text-cyan-600 dark:text-cyan-400">Click to upload</span> or drag and drop
              </p>
              <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">${field.helpText || 'Any file'}</p>
              <div id="upload-progress-${field.name}" class="hidden mt-3">
                <div class="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div id="upload-bar-${field.name}" class="bg-cyan-500 h-2 rounded-full transition-all" style="width: 0%"></div>
                </div>
                <p id="upload-status-${field.name}" class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Uploading...</p>
              </div>
            </div>
            <input type="file" id="file-input-${field.name}" class="hidden"
              ${field.accept ? `accept="${escapeAttr(field.accept)}"` : ''}
              onchange="handleFileSelect(this, '${field.name}', '${escapeAttr(field.accept || '')}')"
            />
            ${value ? `
              <button type="button" onclick="clearFileField('${field.name}')"
                class="mt-2 inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Remove file
              </button>
            ` : ''}
          </div>
          ${errorHTML}
        </div>
      `

    case 'tags':
      const tagsValue = Array.isArray(value) ? value.join(', ') : String(value || '')
      return `
        <div>
          <label for="field-${field.name}" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">${field.label}</label>
          <div class="mt-2">
            <input type="text" id="field-${field.name}" name="${field.name}" value="${escapeAttr(tagsValue)}"
              placeholder="${escapeAttr(field.placeholder || 'Comma-separated tags')}"
              class="${inputClasses}"
            />
          </div>
          <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Separate tags with commas</p>
          ${errorHTML}
        </div>
      `

    default:
      return ''
  }
}

/** Render file preview based on mime type */
function renderFilePreview(url: string, accept?: string): string {
  if (!url) return ''
  const isImage = accept?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
  if (isImage) {
    return `<img src="${escapeAttr(url)}" alt="Preview" class="h-32 w-32 object-cover rounded-lg ring-1 ring-zinc-950/10 dark:ring-white/10">`
  }
  return `
    <div class="inline-flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2 ring-1 ring-zinc-950/10 dark:ring-white/10">
      <svg class="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
      <span class="text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-xs">${escapeHtml(url.split('/').pop() || url)}</span>
    </div>
  `
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function renderContentFormPage(data: ContentFormData): string {
  const isEdit = data.isEdit || !!data.id
  const ct = data.contentType
  const title = isEdit ? `Edit: ${data.title || 'Content'}` : `New ${ct.displayName}`

  const backUrl = data.referrerParams
    ? `/admin/content?${data.referrerParams}`
    : `/admin/content?type=${ct.name}`

  const getFieldValue = (fieldName: string) => {
    if (fieldName === 'title') return data.title || data.data?.[fieldName] || ''
    if (fieldName === 'slug') return data.slug || data.data?.[fieldName] || ''
    return data.data?.[fieldName] || ''
  }

  // Separate fields into groups: core (title), content fields, tag fields
  const titleField = ct.fields.find(f => f.name === 'title')
  const contentFields = ct.fields.filter(f => f.name !== 'title' && f.type !== 'tags')
  const tagFields = ct.fields.filter(f => f.type === 'tags')

  const hasFileUpload = ct.fields.some(f => f.type === 'file')
  const descriptionText = ct.description || `Manage ${ct.displayName.toLowerCase()} content`

  const pageContent = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl/8 font-semibold text-zinc-950 dark:text-white sm:text-xl/8">${isEdit ? 'Edit Content' : 'New Content'}</h1>
          <p class="mt-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
            ${descriptionText}
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <a href="${backUrl}" class="inline-flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm">
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Content
          </a>
        </div>
      </div>

      <!-- Form Container -->
      <div class="mx-auto max-w-2xl rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 overflow-hidden">
        <!-- Form Header -->
        <div class="border-b border-zinc-950/5 dark:border-white/10 px-6 py-6">
          <div class="flex items-center gap-x-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              ${ct.icon}
            </div>
            <div>
              <h2 class="text-base/7 font-semibold text-zinc-950 dark:text-white">${ct.displayName}</h2>
              <p class="text-sm/6 text-zinc-500 dark:text-zinc-400">${isEdit ? 'Update your content' : 'Create new content'}</p>
            </div>
          </div>
        </div>

        <!-- Form Content -->
        <div class="px-6 py-6">
          <div id="form-messages">
            ${data.error ? renderAlert({ type: 'error', message: data.error, dismissible: true }) : ''}
            ${data.success ? renderAlert({ type: 'success', message: data.success, dismissible: true }) : ''}
          </div>

          <form
            id="content-form"
            ${isEdit ? `hx-put="/admin/content/${data.id}"` : `hx-post="/admin/content"`}
            hx-target="#form-messages"
            hx-encoding="multipart/form-data"
            class="space-y-6"
          >
            <input type="hidden" name="content_type" value="${ct.name}">
            ${isEdit ? `<input type="hidden" name="id" value="${data.id}">` : ''}
            ${data.referrerParams ? `<input type="hidden" name="referrer_params" value="${escapeAttr(data.referrerParams)}">` : ''}

            <!-- Title + Slug Fields -->
            ${titleField ? `
              <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 ring-1 ring-zinc-950/5 dark:ring-white/10">
                <h3 class="text-sm font-semibold text-zinc-950 dark:text-white mb-3">Basic Information</h3>
                ${renderField(titleField, getFieldValue('title'), data.validationErrors?.['title'])}
                <div class="mt-4">
                  <label for="slug" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">URL Slug</label>
                  ${isEdit ? `
                    <!-- Edit mode: readonly slug with edit/copy buttons -->
                    <div class="mt-2">
                      <div class="flex items-center gap-2">
                        <div class="flex flex-1 rounded-lg shadow-sm">
                          <span class="inline-flex items-center rounded-l-lg border border-r-0 border-zinc-950/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-500 dark:text-zinc-400">/</span>
                          <input type="text" id="slug" name="slug" value="${escapeAttr(data.slug || '')}"
                            readonly
                            pattern="^[a-zA-Z0-9_-]+$"
                            class="w-full rounded-r-lg bg-zinc-100 dark:bg-zinc-800/80 px-3 py-2 text-sm text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 font-mono cursor-default focus:outline-none transition-shadow"
                          />
                        </div>
                        <button type="button" id="slug-copy-btn" onclick="copySlug()" title="Copy slug"
                          class="inline-flex items-center justify-center rounded-lg p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/></svg>
                        </button>
                        <button type="button" id="slug-edit-btn" onclick="enableSlugEdit()" title="Edit slug"
                          class="inline-flex items-center justify-center rounded-lg p-2 text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
                        </button>
                      </div>
                      <!-- Warning banner (hidden by default, shown when editing) -->
                      <div id="slug-warning" class="hidden mt-2">
                        <div class="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 p-3">
                          <div class="flex gap-2">
                            <svg class="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                            <div>
                              <p class="text-sm font-medium text-amber-800 dark:text-amber-300">Changing the slug may break references</p>
                              <p class="mt-1 text-xs text-amber-700 dark:text-amber-400">Websites or apps consuming this content via the slug URL will stop working if the slug changes.</p>
                            </div>
                          </div>
                        </div>
                        <button type="button" onclick="cancelSlugEdit()" class="mt-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Cancel edit</button>
                      </div>
                      <div id="slug-status" class="mt-1"></div>
                    </div>
                    <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      API access: <code class="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">/api/content/by-slug/${escapeHtml(data.slug || '')}</code>
                    </p>
                  ` : `
                    <!-- Create mode: auto-generate with availability check -->
                    <div class="mt-2 flex rounded-lg shadow-sm">
                      <span class="inline-flex items-center rounded-l-lg border border-r-0 border-zinc-950/10 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-500 dark:text-zinc-400">/</span>
                      <input type="text" id="slug" name="slug" value="${escapeAttr(data.slug || '')}"
                        pattern="^[a-zA-Z0-9_-]+$"
                        placeholder="auto-generated-from-title"
                        class="w-full rounded-r-lg bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white transition-shadow"
                      />
                    </div>
                    <div id="slug-status" class="mt-1"></div>
                    <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Leave blank to auto-generate from title. Only letters, numbers, hyphens, and underscores.</p>
                  `}
                </div>
              </div>
            ` : ''}

            <!-- Content Fields -->
            ${contentFields.length > 0 ? `
              <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 ring-1 ring-zinc-950/5 dark:ring-white/10">
                <h3 class="text-sm font-semibold text-zinc-950 dark:text-white mb-3">Content Details</h3>
                <div class="space-y-4">
                  ${contentFields.map(f => renderField(f, getFieldValue(f.name), data.validationErrors?.[f.name])).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Tags -->
            ${tagFields.length > 0 ? `
              <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 ring-1 ring-zinc-950/5 dark:ring-white/10">
                <h3 class="text-sm font-semibold text-zinc-950 dark:text-white mb-3">Organization</h3>
                <div class="space-y-4">
                  ${tagFields.map(f => renderField(f, getFieldValue(f.name), data.validationErrors?.[f.name])).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Action Buttons -->
            <div class="pt-6 border-t border-zinc-950/5 dark:border-white/10 flex items-center justify-between">
              <a href="${backUrl}" class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm">
                Cancel
              </a>
              <div class="flex items-center gap-x-3">
                ${isEdit ? `
                  <button
                    type="button"
                    onclick="deleteContent('${data.id}')"
                    class="inline-flex items-center justify-center gap-x-1.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                    </svg>
                    Delete
                  </button>
                ` : ''}
                <button
                  type="submit"
                  name="action"
                  value="save"
                  class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  ${isEdit ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialogs -->
    ${renderConfirmationDialog({
      id: 'delete-content-confirm',
      title: 'Delete Content',
      message: 'Are you sure you want to delete this content? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconColor: 'red',
      confirmClass: 'bg-red-500 hover:bg-red-400',
      onConfirm: `performDeleteContent('${data.id}')`
    })}

    ${getConfirmationDialogScript()}

    <script>
      ${hasFileUpload ? getFileUploadScript() : ''}

      // Debounce helper
      function debounce(fn, delay) {
        var timer;
        return function() {
          var args = arguments;
          var ctx = this;
          clearTimeout(timer);
          timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
        };
      }

      // Check slug availability via API
      function checkSlugAvailability(slug, excludeId) {
        var statusEl = document.getElementById('slug-status');
        if (!statusEl) return;

        if (!slug || slug.length === 0) {
          statusEl.innerHTML = '';
          return;
        }

        statusEl.innerHTML = '<p class="text-xs text-zinc-400 dark:text-zinc-500">Checking availability...</p>';

        var url = '/api/content/check-slug?slug=' + encodeURIComponent(slug);
        if (excludeId) url += '&excludeId=' + encodeURIComponent(excludeId);

        fetch(url)
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.available) {
              statusEl.innerHTML = '<p class="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Slug is available</p>';
            } else {
              statusEl.innerHTML = '<p class="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> ' + (data.message || 'Slug is already in use') + '</p>';
            }
          })
          .catch(function() {
            statusEl.innerHTML = '';
          });
      }

      var debouncedCheck = debounce(checkSlugAvailability, 400);
      var contentId = ${isEdit ? `'${data.id}'` : 'null'};

      ${isEdit ? `
        // Edit mode: slug editing with warning
        var originalSlug = '${escapeAttr(data.slug || '')}';

        function copySlug() {
          var text = '/api/content/by-slug/' + originalSlug;
          navigator.clipboard.writeText(text).then(function() {
            var btn = document.getElementById('slug-copy-btn');
            btn.innerHTML = '<svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
            setTimeout(function() {
              btn.innerHTML = '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/></svg>';
            }, 1500);
          });
        }

        function enableSlugEdit() {
          var input = document.getElementById('slug');
          if (input) {
            input.removeAttribute('readonly');
            input.classList.remove('bg-zinc-100', 'dark:bg-zinc-800/80', 'cursor-default');
            input.classList.add('bg-white', 'dark:bg-zinc-800', 'focus:ring-2', 'focus:ring-amber-500', 'dark:focus:ring-amber-400');
            input.focus();
            input.addEventListener('input', function() {
              debouncedCheck(input.value, contentId);
            });
          }
          document.getElementById('slug-warning').classList.remove('hidden');
          document.getElementById('slug-edit-btn').classList.add('hidden');
        }

        function cancelSlugEdit() {
          var input = document.getElementById('slug');
          if (input) {
            input.value = originalSlug;
            input.setAttribute('readonly', '');
            input.classList.add('bg-zinc-100', 'dark:bg-zinc-800/80', 'cursor-default');
            input.classList.remove('bg-white', 'dark:bg-zinc-800', 'focus:ring-2', 'focus:ring-amber-500', 'dark:focus:ring-amber-400');
          }
          document.getElementById('slug-warning').classList.add('hidden');
          document.getElementById('slug-edit-btn').classList.remove('hidden');
          var statusEl = document.getElementById('slug-status');
          if (statusEl) statusEl.innerHTML = '';
        }
      ` : `
        // Create mode: auto-generate slug from title with debounced check
        (function() {
          var titleInput = document.getElementById('field-title');
          var slugInput = document.getElementById('slug');
          var slugManuallyEdited = false;

          if (titleInput && slugInput) {
            slugInput.addEventListener('input', function() {
              slugManuallyEdited = true;
              debouncedCheck(slugInput.value, null);
            });

            titleInput.addEventListener('input', function() {
              if (!slugManuallyEdited || slugInput.value === '') {
                slugManuallyEdited = false;
                var generated = titleInput.value
                  .toLowerCase()
                  .replace(/[^a-z0-9\\s-]/g, '')
                  .replace(/\\s+/g, '-')
                  .replace(/-+/g, '-');
                slugInput.value = generated;
                debouncedCheck(generated, null);
              }
            });
          }
        })();
      `}

      function deleteContent(contentId) {
        showConfirmDialog('delete-content-confirm');
      }

      function performDeleteContent(contentId) {
        fetch('/admin/content/' + contentId, {
          method: 'DELETE'
        })
        .then(function(response) {
          if (response.ok) {
            window.location.href = '/admin/content';
          } else {
            console.error('Error deleting content');
          }
        });
      }

    </script>
  `

  const layoutData: AdminLayoutCatalystData = {
    title: title,
    pageTitle: 'Content Management',
    currentPath: '/admin/content',
    user: data.user,
    content: pageContent,
    version: data.version
  }

  return renderAdminLayoutCatalyst(layoutData)
}

/** File upload handling script */
function getFileUploadScript(): string {
  return `
    function handleFileDrop(event, fieldName, accept) {
      event.preventDefault();
      event.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-50/50', 'dark:bg-cyan-500/5');
      var files = event.dataTransfer.files;
      if (files.length > 0) {
        uploadFile(files[0], fieldName, accept);
      }
    }

    function handleFileSelect(input, fieldName, accept) {
      if (input.files.length > 0) {
        uploadFile(input.files[0], fieldName, accept);
      }
    }

    function uploadFile(file, fieldName, accept) {
      // Validate file type if accept is specified
      if (accept && accept !== '*') {
        var acceptTypes = accept.split(',').map(function(t) { return t.trim(); });
        var accepted = acceptTypes.some(function(type) {
          if (type.endsWith('/*')) {
            return file.type.startsWith(type.replace('/*', '/'));
          }
          return file.type === type;
        });
        if (!accepted) {
          alert('Invalid file type. Accepted: ' + accept);
          return;
        }
      }

      var progressEl = document.getElementById('upload-progress-' + fieldName);
      var barEl = document.getElementById('upload-bar-' + fieldName);
      var statusEl = document.getElementById('upload-status-' + fieldName);
      progressEl.classList.remove('hidden');
      barEl.style.width = '10%';
      statusEl.textContent = 'Uploading ' + file.name + '...';

      var formData = new FormData();
      formData.append('file', file);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/media/upload');

      xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
          var pct = Math.round((e.loaded / e.total) * 100);
          barEl.style.width = pct + '%';
          statusEl.textContent = 'Uploading... ' + pct + '%';
        }
      });

      xhr.addEventListener('load', function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var result = JSON.parse(xhr.responseText);
            var url = result.url || result.data?.url || '';
            document.getElementById('field-' + fieldName).value = url;

            // Show preview
            var previewEl = document.getElementById('file-preview-' + fieldName);
            if (url && previewEl) {
              var isImage = file.type.startsWith('image/');
              if (isImage) {
                previewEl.innerHTML = '<img src="' + url + '" alt="Preview" class="h-32 w-32 object-cover rounded-lg ring-1 ring-zinc-950/10 dark:ring-white/10">';
              } else {
                previewEl.innerHTML = '<div class="inline-flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 px-3 py-2 ring-1 ring-zinc-950/10 dark:ring-white/10"><span class="text-sm text-zinc-700 dark:text-zinc-300">' + file.name + '</span></div>';
              }
              previewEl.classList.remove('hidden');
            }

            barEl.style.width = '100%';
            statusEl.textContent = 'Upload complete!';
            setTimeout(function() { progressEl.classList.add('hidden'); }, 2000);
          } catch(e) {
            statusEl.textContent = 'Upload failed: could not parse response';
          }
        } else {
          statusEl.textContent = 'Upload failed: ' + xhr.statusText;
        }
      });

      xhr.addEventListener('error', function() {
        statusEl.textContent = 'Upload failed: network error';
      });

      xhr.send(formData);
    }

    function clearFileField(fieldName) {
      document.getElementById('field-' + fieldName).value = '';
      var previewEl = document.getElementById('file-preview-' + fieldName);
      if (previewEl) {
        previewEl.innerHTML = '';
        previewEl.classList.add('hidden');
      }
    }
  `
}
