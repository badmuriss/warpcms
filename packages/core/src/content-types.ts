/**
 * Fixed Content Type Definitions
 *
 * WarpCMS uses 5 hardcoded content types instead of dynamic collections.
 * The `collectionId` column in the content table stores the type name.
 */

export interface ContentTypeField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'richtext' | 'file' | 'tags'
  required?: boolean
  placeholder?: string
  /** Accepted MIME types for file fields */
  accept?: string
  /** Help text shown below the field */
  helpText?: string
}

export interface ContentType {
  name: string
  displayName: string
  description: string
  icon: string
  fields: ContentTypeField[]
  /** Accepted MIME types for the primary file upload (if any) */
  acceptedMimeTypes?: string
}

export const CONTENT_TYPES: Record<string, ContentType> = {
  image: {
    name: 'image',
    displayName: 'Image',
    description: 'Upload and manage images with metadata',
    icon: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>`,
    acceptedMimeTypes: 'image/*',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Image title' },
      { name: 'alt_text', label: 'Alt Text', type: 'text', placeholder: 'Descriptive alt text for accessibility' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
      { name: 'file', label: 'Image File', type: 'file', required: true, accept: 'image/*', helpText: 'JPG, PNG, GIF, WebP, SVG' },
      { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'Comma-separated tags' },
    ],
  },
  pdf: {
    name: 'pdf',
    displayName: 'PDF',
    description: 'Upload and manage PDF documents',
    icon: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>`,
    acceptedMimeTypes: 'application/pdf',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Document title' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
      { name: 'file', label: 'PDF File', type: 'file', required: true, accept: 'application/pdf', helpText: 'PDF files only' },
      { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'Comma-separated tags' },
    ],
  },
  text: {
    name: 'text',
    displayName: 'Text',
    description: 'Create plain text content',
    icon: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
    </svg>`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Content title' },
      { name: 'content', label: 'Content', type: 'textarea', required: true, placeholder: 'Write your content here...' },
      { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'Comma-separated tags' },
    ],
  },
  html: {
    name: 'html',
    displayName: 'HTML',
    description: 'Create rich HTML content with the visual editor',
    icon: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
    </svg>`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Content title' },
      { name: 'content', label: 'Content', type: 'richtext', required: true },
      { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'Comma-separated tags' },
    ],
  },
  file: {
    name: 'file',
    displayName: 'File',
    description: 'Upload and manage any type of file',
    icon: `<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
    </svg>`,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'File title' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
      { name: 'file', label: 'File', type: 'file', required: true, helpText: 'Any file type' },
      { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'Comma-separated tags' },
    ],
  },
}

/** Get a content type by name, or undefined if not found */
export function getContentType(name: string): ContentType | undefined {
  return CONTENT_TYPES[name]
}

/** Get all content type names */
export function getContentTypeNames(): string[] {
  return Object.keys(CONTENT_TYPES)
}

/** Get all content types as an array */
export function getAllContentTypes(): ContentType[] {
  return Object.values(CONTENT_TYPES)
}
