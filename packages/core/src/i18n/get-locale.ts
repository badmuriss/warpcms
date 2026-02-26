import type { Context } from 'hono'
import type { Locale } from './types'

const VALID_LOCALES = new Set<string>(['en', 'pt', 'es'])

/**
 * Extract the authenticated user's language preference from the request context.
 * Falls back to 'en' if no user is authenticated or language is not set.
 */
export async function getLocale(c: Context): Promise<Locale> {
  const user = c.get('user') as { userId?: string } | undefined
  if (!user?.userId) return 'en'

  try {
    const db = (c.env as { DB: { prepare: (sql: string) => { bind: (...args: unknown[]) => { first: () => Promise<Record<string, unknown> | null> } } } }).DB
    const result = await db.prepare('SELECT language FROM users WHERE id = ?')
      .bind(user.userId)
      .first()

    const lang = (result as { language?: string } | null)?.language
    if (lang && VALID_LOCALES.has(lang)) return lang as Locale
  } catch {
    // Fall back to default on any DB error
  }

  return 'en'
}
