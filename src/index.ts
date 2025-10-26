import { createMiddleware } from 'hono/factory'
import { Cacheable, Keyv } from 'cacheable'
import KeyvRedis from '@keyv/redis'
import { LRUCache } from 'lru-cache'

export type HonoCacheOptions = {
  /**
   * URL to connect to, like redis://localhost:6379
   * defaults to process.env.REDIS_URL
   * @default process.env.REDIS_URL
   */
  redisUrl?: string
  /**
   * 是否开启多级缓存，当redisUrl存在时生效
   * @default false
   */
  multiLevelEnabled?: boolean
  /**
   * 多级缓存中内存缓存的TTL，单位毫秒，TTL过大可能存在数据不一致问题
   * @default 1000
   */
  multiLevelTtl?: number
}

export class HonoCache {
  private cache: Cacheable

  constructor(opts?: HonoCacheOptions) {
    const redisUrl = opts?.redisUrl || process.env['REDIS_URL']
    if (redisUrl) {
      const redisStore = new KeyvRedis(redisUrl, { keyPrefixSeparator: ':' })
      if (opts?.multiLevelEnabled === true) {
        const primary = new Keyv({
          ttl: opts?.multiLevelTtl || 1000,
          store: new LRUCache({ max: 999 }),
        })
        this.cache = new Cacheable({ namespace: 'honocache', primary, secondary: redisStore })
      } else {
        this.cache = new Cacheable({ namespace: 'honocache', primary: redisStore })
      }
    } else {
      const primary = new Keyv({ store: new LRUCache({ max: 999999 }) })
      this.cache = new Cacheable({ namespace: 'honocache', primary })
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get(key)
  }

  /**
   *
   * 获取缓存，如果不存在则通过func获取并设置缓存
   *
   * @param key the key to set the value of
   * @param func The value to set
   * @param ttl set a number it is miliseconds, set a string it is a human-readable format such as 1s for 1 second or 1h for 1 hour. Setting undefined means that it will use the default time-to-live.
   * @returns
   */
  async getIfPresent<T>(
    key: string,
    func: (() => Promise<T>) | (() => T),
    ttl?: number | string,
  ): Promise<T> {
    let val = await this.get<T>(key)
    if (val === undefined || val === null) {
      val = await func()
      if (val !== undefined && val !== null) {
        await this.set(key, val, ttl)
      }
    }
    return val
  }

  /**
   * Sets the value of the key. If the secondary store is set then it will also set the value in the secondary store.
   * @param {string} key the key to set the value of
   * @param {T} value The value to set
   * @param {number | string} [ttl] set a number it is miliseconds, set a string it is a human-readable
   * format such as `1s` for 1 second or `1h` for 1 hour. Setting undefined means that it will use the default time-to-live.
   * @returns {boolean} Whether the value was set
   */
  async set(key: string, value: any, ttl?: number | string): Promise<boolean> {
    return await this.cache.set(key, value, ttl)
  }

  async delete(key: string) {
    return await this.cache.delete(key)
  }

  /**
   * 关闭连接
   */
  async close() {
    await this.cache.disconnect()
  }
}

/**
 * cache middleware for Hono
 *
 * @param opts HonoCacheOptions
 * @returns middleware
 */
export const cacheMiddleware = (opts?: HonoCacheOptions) => {
  const cacheInstant = new HonoCache(opts)
  return createMiddleware(async (c, next) => {
    c.set('cache', cacheInstant)
    await next()
  })
}

/**
 * create cache instance and middleware for Hono
 *
 * @param opts HonoCacheOptions
 * @returns cacheInstance and middleware
 */
export const createCacheMiddleware = (opts?: HonoCacheOptions) => {
  const cacheInstance = new HonoCache(opts)
  return {
    cache: cacheInstance,
    cacheMiddleware: createMiddleware(async (c, next) => {
      c.set('cache', cacheInstance)
      await next()
    }),
  }
}

declare module 'hono' {
  interface ContextVariableMap {
    cache: HonoCache
  }
}
