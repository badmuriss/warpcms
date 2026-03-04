/**
 * Cache Service Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CacheService, CACHE_CONFIGS, getCacheService } from './cache'

describe('CacheService', () => {
  let cacheService: CacheService

  beforeEach(() => {
    cacheService = new CacheService({
      ttl: 60, // 60 seconds
      keyPrefix: 'test'
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('generateKey', () => {
    it('should generate key with prefix and type', () => {
      const key = cacheService.generateKey('users')
      expect(key).toBe('test:users')
    })

    it('should generate key with prefix, type, and identifier', () => {
      const key = cacheService.generateKey('users', '123')
      expect(key).toBe('test:users:123')
    })

    it('should generate key without identifier when undefined', () => {
      const key = cacheService.generateKey('settings', undefined)
      expect(key).toBe('test:settings')
    })
  })

  describe('get and set', () => {
    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('nonexistent')
      expect(result).toBeNull()
    })

    it('should set and get a value', async () => {
      await cacheService.set('mykey', { foo: 'bar' })
      const result = await cacheService.get('mykey')
      expect(result).toEqual({ foo: 'bar' })
    })

    it('should set and get string values', async () => {
      await cacheService.set('stringkey', 'hello world')
      const result = await cacheService.get<string>('stringkey')
      expect(result).toBe('hello world')
    })

    it('should set and get number values', async () => {
      await cacheService.set('numkey', 42)
      const result = await cacheService.get<number>('numkey')
      expect(result).toBe(42)
    })

    it('should set and get array values', async () => {
      const arr = [1, 2, 3, 'four']
      await cacheService.set('arrkey', arr)
      const result = await cacheService.get<any[]>('arrkey')
      expect(result).toEqual(arr)
    })

    it('should use default TTL when not specified', async () => {
      vi.useFakeTimers()
      const now = Date.now()
      vi.setSystemTime(now)

      await cacheService.set('ttlkey', 'value')

      // Should exist before TTL expires
      vi.setSystemTime(now + 59000) // 59 seconds later
      let result = await cacheService.get('ttlkey')
      expect(result).toBe('value')

      // Should be expired after TTL
      vi.setSystemTime(now + 61000) // 61 seconds later
      result = await cacheService.get('ttlkey')
      expect(result).toBeNull()
    })

    it('should use custom TTL when specified', async () => {
      vi.useFakeTimers()
      const now = Date.now()
      vi.setSystemTime(now)

      await cacheService.set('customttl', 'value', 5) // 5 second TTL

      // Should exist before custom TTL expires
      vi.setSystemTime(now + 4000)
      let result = await cacheService.get('customttl')
      expect(result).toBe('value')

      // Should be expired after custom TTL
      vi.setSystemTime(now + 6000)
      result = await cacheService.get('customttl')
      expect(result).toBeNull()
    })
  })

  describe('getWithSource', () => {
    it('should return hit false when key does not exist', async () => {
      const result = await cacheService.getWithSource('nonexistent')
      expect(result).toEqual({
        hit: false,
        data: null,
        source: 'none'
      })
    })

    it('should return hit true with data when key exists', async () => {
      await cacheService.set('sourcekey', { test: true })
      const result = await cacheService.getWithSource('sourcekey')

      expect(result.hit).toBe(true)
      expect(result.data).toEqual({ test: true })
      expect(result.source).toBe('memory')
      expect(typeof result.ttl).toBe('number')
      expect(result.ttl).toBeGreaterThan(0)
    })

    it('should return none source when entry has expired', async () => {
      vi.useFakeTimers()
      const now = Date.now()
      vi.setSystemTime(now)

      await cacheService.set('expirekey', 'value', 10)

      // Advance past TTL
      vi.setSystemTime(now + 11000)

      const result = await cacheService.getWithSource('expirekey')
      expect(result).toEqual({
        hit: false,
        data: null,
        source: 'none'
      })
    })

    it('should return correct remaining TTL', async () => {
      vi.useFakeTimers()
      const now = Date.now()
      vi.setSystemTime(now)

      await cacheService.set('ttlcheck', 'value', 100) // 100 second TTL

      // Advance 30 seconds
      vi.setSystemTime(now + 30000)

      const result = await cacheService.getWithSource('ttlcheck')
      expect(result.ttl).toBeCloseTo(70, 0) // ~70 seconds remaining
    })
  })

  describe('delete', () => {
    it('should delete an existing key', async () => {
      await cacheService.set('deletekey', 'value')
      expect(await cacheService.get('deletekey')).toBe('value')

      await cacheService.delete('deletekey')
      expect(await cacheService.get('deletekey')).toBeNull()
    })

    it('should not throw when deleting non-existent key', async () => {
      await expect(cacheService.delete('nonexistent')).resolves.not.toThrow()
    })
  })

  describe('invalidate', () => {
    it('should invalidate keys matching exact pattern', async () => {
      await cacheService.set('user:1', 'user1')
      await cacheService.set('user:2', 'user2')
      await cacheService.set('post:1', 'post1')

      await cacheService.invalidate('user:1')

      expect(await cacheService.get('user:1')).toBeNull()
      expect(await cacheService.get('user:2')).toBe('user2')
      expect(await cacheService.get('post:1')).toBe('post1')
    })

    it('should invalidate keys matching wildcard pattern', async () => {
      await cacheService.set('user:1', 'user1')
      await cacheService.set('user:2', 'user2')
      await cacheService.set('user:10', 'user10')
      await cacheService.set('post:1', 'post1')

      await cacheService.invalidate('user:*')

      expect(await cacheService.get('user:1')).toBeNull()
      expect(await cacheService.get('user:2')).toBeNull()
      expect(await cacheService.get('user:10')).toBeNull()
      expect(await cacheService.get('post:1')).toBe('post1')
    })

    it('should invalidate keys matching question mark pattern', async () => {
      await cacheService.set('user:1', 'user1')
      await cacheService.set('user:2', 'user2')
      await cacheService.set('user:10', 'user10')

      await cacheService.invalidate('user:?')

      expect(await cacheService.get('user:1')).toBeNull()
      expect(await cacheService.get('user:2')).toBeNull()
      expect(await cacheService.get('user:10')).toBe('user10') // Not matched (2 chars)
    })

    it('should handle complex patterns', async () => {
      await cacheService.set('api:users:list', 'list')
      await cacheService.set('api:users:123', 'user123')
      await cacheService.set('api:posts:list', 'posts')

      await cacheService.invalidate('api:users:*')

      expect(await cacheService.get('api:users:list')).toBeNull()
      expect(await cacheService.get('api:users:123')).toBeNull()
      expect(await cacheService.get('api:posts:list')).toBe('posts')
    })
  })

  describe('clear', () => {
    it('should clear all cached values', async () => {
      await cacheService.set('key1', 'value1')
      await cacheService.set('key2', 'value2')
      await cacheService.set('key3', 'value3')

      await cacheService.clear()

      expect(await cacheService.get('key1')).toBeNull()
      expect(await cacheService.get('key2')).toBeNull()
      expect(await cacheService.get('key3')).toBeNull()
    })

    it('should not throw when clearing empty cache', async () => {
      await expect(cacheService.clear()).resolves.not.toThrow()
    })
  })

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      await cacheService.set('orsetkey', 'cached')
      const callback = vi.fn().mockResolvedValue('fresh')

      const result = await cacheService.getOrSet('orsetkey', callback)

      expect(result).toBe('cached')
      expect(callback).not.toHaveBeenCalled()
    })

    it('should call callback and cache result if key does not exist', async () => {
      const callback = vi.fn().mockResolvedValue('fresh')

      const result = await cacheService.getOrSet('newkey', callback)

      expect(result).toBe('fresh')
      expect(callback).toHaveBeenCalledTimes(1)

      // Verify it was cached
      expect(await cacheService.get('newkey')).toBe('fresh')
    })

    it('should use custom TTL when provided', async () => {
      vi.useFakeTimers()
      const now = Date.now()
      vi.setSystemTime(now)

      const callback = vi.fn().mockResolvedValue('value')
      await cacheService.getOrSet('customttlkey', callback, 5)

      // Verify cached
      vi.setSystemTime(now + 3000)
      expect(await cacheService.get('customttlkey')).toBe('value')

      // Verify expired
      vi.setSystemTime(now + 6000)
      expect(await cacheService.get('customttlkey')).toBeNull()
    })

    it('should handle async callbacks correctly', async () => {
      const callback = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { data: 'async result' }
      })

      const result = await cacheService.getOrSet('asynckey', callback)
      expect(result).toEqual({ data: 'async result' })
    })

    it('should call callback again after cache expires', async () => {
      vi.useFakeTimers()
      const now = Date.now()
      vi.setSystemTime(now)

      let callCount = 0
      const callback = vi.fn().mockImplementation(async () => {
        callCount++
        return `value${callCount}`
      })

      // First call - sets cache
      const result1 = await cacheService.getOrSet('expirekey', callback, 5)
      expect(result1).toBe('value1')
      expect(callback).toHaveBeenCalledTimes(1)

      // Second call within TTL - uses cache
      vi.setSystemTime(now + 3000)
      const result2 = await cacheService.getOrSet('expirekey', callback, 5)
      expect(result2).toBe('value1')
      expect(callback).toHaveBeenCalledTimes(1)

      // Third call after TTL - calls callback again
      vi.setSystemTime(now + 6000)
      const result3 = await cacheService.getOrSet('expirekey', callback, 5)
      expect(result3).toBe('value2')
      expect(callback).toHaveBeenCalledTimes(2)
    })
  })
})

describe('CACHE_CONFIGS', () => {
  it('should have api config with correct values', () => {
    expect(CACHE_CONFIGS.api).toEqual({
      ttl: 300,
      keyPrefix: 'api'
    })
  })

  it('should have user config with correct values', () => {
    expect(CACHE_CONFIGS.user).toEqual({
      ttl: 600,
      keyPrefix: 'user'
    })
  })

  it('should have content config with correct values', () => {
    expect(CACHE_CONFIGS.content).toEqual({
      ttl: 300,
      keyPrefix: 'content'
    })
  })

  it('should have collection config with correct values', () => {
    expect(CACHE_CONFIGS.collection).toEqual({
      ttl: 600,
      keyPrefix: 'collection'
    })
  })
})

describe('CacheService with KV', () => {
  let mockKv: {
    get: ReturnType<typeof vi.fn>
    put: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  let kvCache: CacheService

  beforeEach(() => {
    mockKv = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    kvCache = new CacheService(
      { ttl: 60, keyPrefix: 'test' },
      mockKv as unknown as KVNamespace
    )
  })

  it('should fall back to KV on memory miss', async () => {
    mockKv.get.mockResolvedValue({ id: 1, title: 'from kv' })

    const result = await kvCache.get('content:item:1')
    expect(result).toEqual({ id: 1, title: 'from kv' })
    expect(mockKv.get).toHaveBeenCalledWith('content:item:1', 'json')
  })

  it('should not call KV when memory has a hit', async () => {
    await kvCache.set('mykey', 'memvalue')
    const result = await kvCache.get('mykey')
    expect(result).toBe('memvalue')
    // KV get should not be called for the get (it's called 0 times for reads)
    expect(mockKv.get).not.toHaveBeenCalled()
  })

  it('should populate memory cache after KV hit', async () => {
    mockKv.get.mockResolvedValue('kvdata')

    // First call hits KV
    await kvCache.get('popkey')
    expect(mockKv.get).toHaveBeenCalledTimes(1)

    // Second call should hit memory, not KV again
    mockKv.get.mockClear()
    const result = await kvCache.get('popkey')
    expect(result).toBe('kvdata')
    expect(mockKv.get).not.toHaveBeenCalled()
  })

  it('should write to both memory and KV on set', async () => {
    await kvCache.set('writekey', { data: true }, 120)

    expect(mockKv.put).toHaveBeenCalledWith(
      'writekey',
      JSON.stringify({ data: true }),
      { expirationTtl: 120 }
    )

    // Memory should also have it
    const result = await kvCache.get('writekey')
    expect(result).toEqual({ data: true })
    expect(mockKv.get).not.toHaveBeenCalled()
  })

  it('should delete from both memory and KV', async () => {
    await kvCache.set('delkey', 'val')
    await kvCache.delete('delkey')

    expect(mockKv.delete).toHaveBeenCalledWith('delkey')
    expect(await kvCache.get('delkey')).toBeNull()
  })

  it('should only invalidate memory, not KV', async () => {
    await kvCache.set('content:list:a', 'data')
    await kvCache.invalidate('content:list:*')

    // Memory should be cleared
    expect(await kvCache.get('content:list:a')).toBeNull()
    // KV delete should NOT have been called by invalidate
    expect(mockKv.delete).not.toHaveBeenCalled()
  })

  it('should return kv source from getWithSource', async () => {
    mockKv.get.mockResolvedValue({ from: 'kv' })

    const result = await kvCache.getWithSource('kvitem')
    expect(result).toEqual({
      hit: true,
      data: { from: 'kv' },
      source: 'kv',
      ttl: 60
    })
  })

  it('should return memory source from getWithSource', async () => {
    await kvCache.set('memitem', 'memdata')

    const result = await kvCache.getWithSource('memitem')
    expect(result.hit).toBe(true)
    expect(result.source).toBe('memory')
    expect(result.data).toBe('memdata')
  })

  it('should silently skip KV errors on get', async () => {
    mockKv.get.mockRejectedValue(new Error('KV unavailable'))

    const result = await kvCache.get('errorkey')
    expect(result).toBeNull()
  })

  it('should silently skip KV errors on set', async () => {
    mockKv.put.mockRejectedValue(new Error('KV unavailable'))

    // Should not throw, and memory cache should still work
    await expect(kvCache.set('errorkey', 'val')).resolves.not.toThrow()
    const result = await kvCache.get('errorkey')
    expect(result).toBe('val')
  })

  it('should silently skip KV errors on delete', async () => {
    mockKv.delete.mockRejectedValue(new Error('KV unavailable'))
    await expect(kvCache.delete('errorkey')).resolves.not.toThrow()
  })

  it('getOrSet should use two-tier lookup before calling fetcher', async () => {
    mockKv.get.mockResolvedValue('kv-cached')
    const fetcher = vi.fn().mockResolvedValue('fresh')

    const result = await kvCache.getOrSet('orsetkey', fetcher)
    expect(result).toBe('kv-cached')
    expect(fetcher).not.toHaveBeenCalled()
  })
})

describe('CacheService without KV (undefined)', () => {
  it('should work as memory-only when kvNamespace is undefined', async () => {
    const cache = new CacheService({ ttl: 60, keyPrefix: 'test' })
    await cache.set('key', 'value')
    expect(await cache.get('key')).toBe('value')
    await cache.delete('key')
    expect(await cache.get('key')).toBeNull()
  })
})

describe('getCacheService', () => {
  it('should return a new CacheService instance', () => {
    const service = getCacheService({ ttl: 120, keyPrefix: 'myprefix' })
    expect(service).toBeInstanceOf(CacheService)
  })

  it('should create service with provided config', () => {
    const service = getCacheService({ ttl: 120, keyPrefix: 'custom' })
    const key = service.generateKey('type', 'id')
    expect(key).toBe('custom:type:id')
  })

  it('should create independent service instances', () => {
    const service1 = getCacheService({ ttl: 60, keyPrefix: 'svc1' })
    const service2 = getCacheService({ ttl: 60, keyPrefix: 'svc2' })

    expect(service1.generateKey('test')).toBe('svc1:test')
    expect(service2.generateKey('test')).toBe('svc2:test')
  })
})
