import type { TranslationData, TranslationKeys, Locale } from './types'
import { en } from './locales/en'
import { pt } from './locales/pt'
import { es } from './locales/es'

const locales: Record<Locale, TranslationData> = { en, pt, es }

function getNestedValue(obj: TranslationData, key: string): string | undefined {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return key in params ? String(params[key]) : `{{${key}}}`
  })
}

/**
 * Look up a translation key for a given locale.
 * Falls back to English if the key is missing in the requested locale.
 * Returns the key itself if missing from all locales.
 */
export function t(
  key: TranslationKeys,
  locale: Locale | string,
  params?: Record<string, string | number>,
): string {
  const loc = (locale in locales ? locale : 'en') as Locale

  let value = getNestedValue(locales[loc], key)

  // Fallback to English
  if (value === undefined && loc !== 'en') {
    value = getNestedValue(locales.en, key)
  }

  // Key not found anywhere
  if (value === undefined) {
    if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production') {
      console.warn(`[i18n] Missing translation key: "${key}"`)
    }
    return key
  }

  return params ? interpolate(value, params) : value
}
