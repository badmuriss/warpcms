import { renderAdminLayoutCatalyst, AdminLayoutCatalystData } from '../layouts/admin-layout-catalyst.template'
import { renderAlert } from '../components/alert.template'
import { renderConfirmationDialog, getConfirmationDialogScript } from '../components/confirmation-dialog.template'
import type { ContentType, ContentTypeField } from '../../content-types'

export interface ContentFormData {
  id?: string
  title?: string
  slug?: string
  data?: any
  status?: string
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

  const hasRichtext = ct.fields.some(f => f.type === 'richtext')
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
      <div class="rounded-lg bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 overflow-hidden">
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

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content Form -->
        <div class="lg:col-span-2">
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

            <!-- Title Field -->
            ${titleField ? `
              <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 ring-1 ring-zinc-950/5 dark:ring-white/10">
                <h3 class="text-sm font-semibold text-zinc-950 dark:text-white mb-3">Basic Information</h3>
                ${renderField(titleField, getFieldValue('title'), data.validationErrors?.['title'])}
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

            <div id="form-messages"></div>
          </form>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Publishing Options -->
          <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6">
            <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white mb-4">Publishing</h3>
            <div class="mb-6">
              <label for="status" class="block text-sm/6 font-medium text-zinc-950 dark:text-white">Status</label>
              <div class="mt-2 grid grid-cols-1">
                <select
                  id="status"
                  name="status"
                  form="content-form"
                  class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white/5 dark:bg-white/5 py-1.5 pl-3 pr-8 text-base text-zinc-950 dark:text-white outline outline-1 -outline-offset-1 outline-zinc-500/30 dark:outline-zinc-400/30 *:bg-white dark:*:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400 sm:text-sm/6"
                >
                  <option value="draft" ${data.status === 'draft' ? 'selected' : ''}>Draft</option>
                  <option value="published" ${data.status === 'published' ? 'selected' : ''}>Published</option>
                </select>
                <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-zinc-600 dark:text-zinc-400 sm:size-4">
                  <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Content Info -->
          ${isEdit ? `
            <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6">
              <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white mb-4">Content Info</h3>
              <dl class="space-y-3 text-sm">
                <div>
                  <dt class="text-zinc-500 dark:text-zinc-400">Type</dt>
                  <dd class="mt-1 text-zinc-950 dark:text-white">${ct.displayName}</dd>
                </div>
                <div>
                  <dt class="text-zinc-500 dark:text-zinc-400">Created</dt>
                  <dd class="mt-1 text-zinc-950 dark:text-white">${data.data?.created_at ? new Date(data.data.created_at).toLocaleDateString() : 'Unknown'}</dd>
                </div>
                <div>
                  <dt class="text-zinc-500 dark:text-zinc-400">Last Modified</dt>
                  <dd class="mt-1 text-zinc-950 dark:text-white">${data.data?.updated_at ? new Date(data.data.updated_at).toLocaleDateString() : 'Unknown'}</dd>
                </div>
              </dl>
              <div class="mt-4 pt-4 border-t border-zinc-950/5 dark:border-white/10">
                <button
                  type="button"
                  onclick="showVersionHistory('${data.id}')"
                  class="inline-flex items-center gap-x-1.5 text-sm font-medium text-zinc-950 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  View Version History
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Quick Actions -->
          <div class="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10 p-6">
            <h3 class="text-base/7 font-semibold text-zinc-950 dark:text-white mb-4">Quick Actions</h3>
            <div class="space-y-2">
              <button
                type="button"
                onclick="duplicateContent()"
                class="w-full inline-flex items-center gap-x-2 px-3 py-2 text-sm font-medium text-zinc-950 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Duplicate Content
              </button>
              ${isEdit ? `
                <button
                  type="button"
                  onclick="deleteContent('${data.id}')"
                  class="w-full inline-flex items-center gap-x-2 px-3 py-2 text-sm font-medium text-pink-700 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                  </svg>
                  Delete Content
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="lg:col-span-3 mt-6 pt-6 border-t border-zinc-950/5 dark:border-white/10 flex items-center justify-between">
          <a href="${backUrl}" class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm font-semibold text-zinc-950 dark:text-white ring-1 ring-inset ring-zinc-950/10 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Cancel
          </a>
          <div class="flex items-center gap-x-3">
            <button
              type="submit"
              form="content-form"
              name="action"
              value="save"
              class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-zinc-950 dark:bg-white px-3.5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              ${isEdit ? 'Update' : 'Save'}
            </button>
            ${data.user?.role !== 'viewer' ? `
              <button
                type="submit"
                form="content-form"
                name="action"
                value="save_and_publish"
                class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-lime-600 dark:bg-lime-500 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-lime-700 dark:hover:bg-lime-600 transition-colors shadow-sm"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                ${isEdit ? 'Update' : 'Save'} & Publish
              </button>
            ` : ''}
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Confirmation Dialogs -->
    ${renderConfirmationDialog({
      id: 'duplicate-content-confirm',
      title: 'Duplicate Content',
      message: 'Create a copy of this content?',
      confirmText: 'Duplicate',
      cancelText: 'Cancel',
      iconColor: 'blue',
      confirmClass: 'bg-blue-500 hover:bg-blue-400',
      onConfirm: 'performDuplicateContent()'
    })}

    ${renderConfirmationDialog({
      id: 'delete-content-confirm',
      title: 'Delete Content',
      message: 'Are you sure you want to delete this content? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      iconColor: 'red',
      confirmClass: 'bg-red-500 hover:bg-red-400',
      onConfirm: `performDeleteContent('\${data.id}')`
    })}

    ${getConfirmationDialogScript()}

    ${hasRichtext ? getQuillCDNAndInit(ct.fields.filter(f => f.type === 'richtext')) : ''}

    <script>
      ${hasFileUpload ? getFileUploadScript() : ''}

      // Quick actions
      function duplicateContent() {
        showConfirmDialog('duplicate-content-confirm');
      }

      function performDuplicateContent() {
        var form = document.getElementById('content-form');
        var formData = new FormData(form);
        formData.append('action', 'duplicate');

        fetch('/admin/content/duplicate', {
          method: 'POST',
          body: formData
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
          if (data.success) {
            window.location.href = '/admin/content/' + data.id + '/edit';
          } else {
            alert('Error duplicating content');
          }
        });
      }

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
            alert('Error deleting content');
          }
        });
      }

      function showVersionHistory(contentId) {
        var modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
        modal.innerHTML = '<div id="version-history-content"><div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div></div></div>';
        document.body.appendChild(modal);

        fetch('/admin/content/' + contentId + '/versions')
        .then(function(response) { return response.text(); })
        .then(function(html) {
          document.getElementById('version-history-content').innerHTML = html;
        })
        .catch(function(error) {
          console.error('Error loading version history:', error);
          document.getElementById('version-history-content').innerHTML = '<p class="text-zinc-950 dark:text-white">Error loading version history</p>';
        });
      }

      // Auto-save
      let autoSaveTimeout;
      function scheduleAutoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
          const form = document.getElementById('content-form');
          const formData = new FormData(form);
          formData.append('action', 'autosave');
          fetch(form.action, { method: 'POST', body: formData })
            .then(r => { if (r.ok) console.log('Auto-saved'); })
            .catch(e => console.error('Auto-save failed:', e));
        }, 30000);
      }

      document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('content-form');
        if (form) {
          form.addEventListener('input', scheduleAutoSave);
          form.addEventListener('change', scheduleAutoSave);
        }
      });
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

/** Quill editor CDN + init script for richtext fields */
function getQuillCDNAndInit(richtextFields: ContentTypeField[]): string {
  return `
    <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">
    <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        ${richtextFields.map(f => `
          (function() {
            var quill = new Quill('#quill-editor-${f.name}', {
              theme: 'snow',
              modules: {
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['blockquote', 'code-block'],
                  ['link', 'image'],
                  ['clean']
                ]
              },
              placeholder: 'Write your content here...'
            });
            var hiddenInput = document.getElementById('field-${f.name}');
            if (hiddenInput && hiddenInput.value) {
              quill.root.innerHTML = hiddenInput.value;
            }
            quill.on('text-change', function() {
              hiddenInput.value = quill.root.innerHTML;
            });
            var form = document.getElementById('content-form');
            if (form) {
              form.addEventListener('submit', function() {
                hiddenInput.value = quill.root.innerHTML;
              });
            }
          })();
        `).join('')}
      });
    </script>
  `
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
