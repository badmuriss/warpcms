import { describe, it, expect, vi, beforeEach } from 'vitest'
import { t } from '../../i18n/t'

describe('t() - translation function', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('key lookup', () => {
    it('should return English translation for a valid key', () => {
      expect(t('common.save', 'en')).toBe('Save')
    })

    it('should return Portuguese translation for a valid key', () => {
      expect(t('common.save', 'pt')).toBe('Salvar')
    })

    it('should return Spanish translation for a valid key', () => {
      expect(t('common.save', 'es')).toBe('Guardar')
    })

    it('should resolve nested namespace keys', () => {
      expect(t('nav.dashboard', 'en')).toBe('Dashboard')
      expect(t('nav.settings', 'pt')).toBe('Configurações')
      expect(t('nav.signOut', 'es')).toBe('Cerrar Sesión')
    })
  })

  describe('fallback behavior', () => {
    it('should fall back to English for an unknown locale', () => {
      expect(t('common.save', 'fr')).toBe('Save')
    })
  })

  describe('missing key handling', () => {
    it('should return the key itself if missing from all locales', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      // @ts-expect-error - testing missing key
      const result = t('nonexistent.key', 'en')
      expect(result).toBe('nonexistent.key')
      expect(warnSpy).toHaveBeenCalledWith('[i18n] Missing translation key: "nonexistent.key"')
    })
  })

  describe('interpolation', () => {
    it('should interpolate {{variable}} placeholders', () => {
      expect(t('common.itemCount', 'en', { count: 5 })).toBe('5 items')
      expect(t('common.itemCount', 'pt', { count: 3 })).toBe('3 itens')
      expect(t('common.itemCount', 'es', { count: 10 })).toBe('10 elementos')
    })

    it('should leave unmatched placeholders as-is', () => {
      expect(t('common.itemCount', 'en', {})).toBe('{{count}} items')
    })

    it('should not affect strings without placeholders', () => {
      expect(t('common.save', 'en', { unused: 'value' })).toBe('Save')
    })
  })

  describe('all required common keys exist', () => {
    const commonKeys = [
      'common.save', 'common.cancel', 'common.delete', 'common.confirm',
      'common.edit', 'common.create', 'common.back', 'common.search',
      'common.loading', 'common.noResults', 'common.actions', 'common.status',
      'common.active', 'common.inactive', 'common.error', 'common.success',
      'common.warning',
    ] as const

    for (const key of commonKeys) {
      it(`should have '${key}' in all locales`, () => {
        const enVal = t(key, 'en')
        const ptVal = t(key, 'pt')
        const esVal = t(key, 'es')
        expect(enVal).not.toBe(key) // not falling through to key return
        expect(ptVal).not.toBe(key)
        expect(esVal).not.toBe(key)
      })
    }
  })

  describe('all required nav keys exist', () => {
    const navKeys = [
      'nav.dashboard', 'nav.content', 'nav.users', 'nav.plugins',
      'nav.cache', 'nav.design', 'nav.logs', 'nav.settings',
      'nav.apiReference', 'nav.myProfile', 'nav.signOut',
    ] as const

    for (const key of navKeys) {
      it(`should have '${key}' in all locales`, () => {
        const enVal = t(key, 'en')
        const ptVal = t(key, 'pt')
        const esVal = t(key, 'es')
        expect(enVal).not.toBe(key)
        expect(ptVal).not.toBe(key)
        expect(esVal).not.toBe(key)
      })
    }
  })
})
