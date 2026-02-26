import type { en } from './locales/en'

/** Convert all leaf string literals in a type to `string` */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown> ? DeepStringify<T[K]> : string
}

/** The full translation data structure — same shape as English, but with string values */
export type TranslationData = DeepStringify<typeof en>

/** Flatten nested keys into dot-notation strings: e.g., 'common.save' | 'nav.dashboard' */
type FlattenKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? FlattenKeys<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`
}[keyof T & string]

/** All valid translation keys in dot notation — derived from English locale structure */
export type TranslationKeys = FlattenKeys<typeof en>

/** Supported locales */
export type Locale = 'en' | 'pt' | 'es'
