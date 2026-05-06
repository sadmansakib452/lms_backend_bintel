import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

/**
 * Cache Helper Service
 * Provides abstraction layer for Redis cache operations
 * Used for storing and retrieving cached data with TTL support
 *
 * @class CacheHelper
 */
@Injectable()
export class CacheHelper {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Set value in cache with TTL
   * @param key - Cache key
   * @param value - Value to cache (object will be stringified)
   * @param ttlSeconds - Time to live in seconds (default: 300)
   * @returns Promise<void>
   *
   * @example
   * await cacheHelper.set('permissions:user_123', permissions, 300);
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serializedValue);
    } catch (error) {
      console.error(`[CacheHelper] Error setting cache key ${key}:`, error);
      // Don't throw - cache is non-critical
    }
  }

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Promise<T | null> - Cached value or null if not found
   *
   * @example
   * const permissions = await cacheHelper.get('permissions:user_123');
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[CacheHelper] Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete specific cache key
   * @param key - Cache key to delete
   * @returns Promise<boolean> - True if deleted, false if didn't exist
   *
   * @example
   * await cacheHelper.delete('permissions:user_123');
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error(`[CacheHelper] Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple cache keys by pattern
   * Useful for bulk invalidation (e.g., all user permissions after role change)
   * @param pattern - Redis key pattern (e.g., 'permissions:*')
   * @returns Promise<number> - Number of keys deleted
   *
   * @example
   * await cacheHelper.deleteByPattern('permissions:user_123:*');
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.redis.del(...keys);
    } catch (error) {
      console.error(
        `[CacheHelper] Error deleting cache pattern ${pattern}:`,
        error,
      );
      return 0;
    }
  }

  /**
   * Clear all cache (use with caution, typically only for testing)
   * @returns Promise<void>
   *
   * @example
   * await cacheHelper.flushAll();
   */
  async flushAll(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('[CacheHelper] Error flushing all cache:', error);
    }
  }

  /**
   * Check if key exists in cache
   * @param key - Cache key to check
   * @returns Promise<boolean>
   *
   * @example
   * const exists = await cacheHelper.exists('permissions:user_123');
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`[CacheHelper] Error checking cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL of a cache key in seconds
   * @param key - Cache key
   * @returns Promise<number> - TTL in seconds (-1 if no expiry, -2 if doesn't exist)
   *
   * @example
   * const ttl = await cacheHelper.getTTL('permissions:user_123');
   */
  async getTTL(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error(`[CacheHelper] Error getting TTL for key ${key}:`, error);
      return -2;
    }
  }
}
