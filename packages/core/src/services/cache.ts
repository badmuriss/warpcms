/**
 * Simple Cache Service
 *
 * Provides basic caching functionality for the core package
 * Supports optional KV namespace for persistent caching across cold starts
 */

export interface CacheConfig {
  ttl: number // Time to live in seconds
  keyPrefix: string
}

export type CacheSource = 'memory' | 'kv' | 'none'

export class CacheService {
  private config: CacheConfig
  private memoryCache: Map<string, { value: any; expires: number }> = new Map()
  private kvNamespace?: KVNamespace

  constructor(config: CacheConfig, kvNamespace?: KVNamespace) {
    this.config = config
    this.kvNamespace = kvNamespace
  }

  /**
   * Generate cache key with prefix
   */
  generateKey(type: string, identifier?: string): string {
    const parts = [this.config.keyPrefix, type]
    if (identifier) {
      parts.push(identifier)
    }
    return parts.join(':')
  }

  /**
   * Get value from cache (memory first, then KV fallback)
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory first
    const cached = this.memoryCache.get(key)

    if (cached) {
      if (Date.now() > cached.expires) {
        this.memoryCache.delete(key)
      } else {
        return cached.value as T
      }
    }

    // Fall back to KV
    if (this.kvNamespace) {
      try {
        const kvValue = await this.kvNamespace.get<T>(key, 'json')
        if (kvValue !== null) {
          // Populate memory cache from KV hit
          const expires = Date.now() + this.config.ttl * 1000
          this.memoryCache.set(key, { value: kvValue, expires })
          return kvValue
        }
      } catch {
        // Silently skip KV errors
      }
    }

    return null
  }

  /**
   * Get value from cache with source information
   */
  async getWithSource<T>(key: string): Promise<{
    hit: boolean
    data: T | null
    source: CacheSource
    ttl?: number
  }> {
    // Check memory first
    const cached = this.memoryCache.get(key)

    if (cached) {
      if (Date.now() > cached.expires) {
        this.memoryCache.delete(key)
      } else {
        return {
          hit: true,
          data: cached.value as T,
          source: 'memory',
          ttl: (cached.expires - Date.now()) / 1000
        }
      }
    }

    // Fall back to KV
    if (this.kvNamespace) {
      try {
        const kvValue = await this.kvNamespace.get<T>(key, 'json')
        if (kvValue !== null) {
          // Populate memory cache from KV hit
          const expires = Date.now() + this.config.ttl * 1000
          this.memoryCache.set(key, { value: kvValue, expires })
          return {
            hit: true,
            data: kvValue,
            source: 'kv',
            ttl: this.config.ttl
          }
        }
      } catch {
        // Silently skip KV errors
      }
    }

    return {
      hit: false,
      data: null,
      source: 'none'
    }
  }

  /**
   * Set value in both memory and KV cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const effectiveTtl = ttl || this.config.ttl
    const expires = Date.now() + effectiveTtl * 1000
    this.memoryCache.set(key, { value, expires })

    // Write-through to KV
    if (this.kvNamespace) {
      try {
        await this.kvNamespace.put(key, JSON.stringify(value), {
          expirationTtl: effectiveTtl
        })
      } catch {
        // Silently skip KV errors
      }
    }
  }

  /**
   * Delete specific key from both memory and KV cache
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)

    if (this.kvNamespace) {
      try {
        await this.kvNamespace.delete(key)
      } catch {
        // Silently skip KV errors
      }
    }
  }

  /**
   * Invalidate cache keys matching a pattern
   * Memory only — KV entries expire via TTL
   */
  async invalidate(pattern: string): Promise<void> {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    const regex = new RegExp(`^${regexPattern}$`)

    // Find and delete matching keys from memory only
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key)
      }
    }
  }

  /**
   * Clear all memory cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()
  }

  /**
   * Get value from cache or set it using a callback (two-tier lookup)
   */
  async getOrSet<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key)

    if (cached !== null) {
      return cached
    }

    const value = await callback()
    await this.set(key, value, ttl)
    return value
  }
}

const DEFAULT_CACHE_TTL = 300

/**
 * Parse CACHE_TTL from environment bindings, falling back to 300s default.
 */
export function parseCacheTtl(env: { CACHE_TTL?: string }): number {
  if (!env.CACHE_TTL) return DEFAULT_CACHE_TTL
  const parsed = parseInt(env.CACHE_TTL, 10)
  return Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_CACHE_TTL : parsed
}

/**
 * Cache configurations for different data types
 */
export const CACHE_CONFIGS = {
  api: {
    ttl: 300, // 5 minutes
    keyPrefix: 'api'
  },
  user: {
    ttl: 600, // 10 minutes
    keyPrefix: 'user'
  },
  content: {
    ttl: 300, // 5 minutes
    keyPrefix: 'content'
  },
  collection: {
    ttl: 600, // 10 minutes
    keyPrefix: 'collection'
  }
}

/**
 * Get cache service instance for a config, optionally backed by KV
 */
export function getCacheService(config: CacheConfig, kvNamespace?: KVNamespace): CacheService {
  return new CacheService(config, kvNamespace)
}
