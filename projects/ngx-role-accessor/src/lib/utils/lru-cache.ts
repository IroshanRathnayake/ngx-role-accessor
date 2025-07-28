/**
 * @fileoverview LRU Cache implementation for RBAC system
 * @author Iroshan Rathnayake
 * @version 2.0.0
 */

import { CacheEntry } from '../types/rbac.types';

/**
 * Generic LRU (Least Recently Used) cache implementation
 * Provides efficient caching with automatic eviction of least recently used items
 * 
 * @template T The type of values stored in the cache
 */
export class LruCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTtl: number;

  /**
   * Creates a new LRU cache instance
   * 
   * @param maxSize - Maximum number of entries to store (default: 1000)
   * @param defaultTtl - Default time-to-live in milliseconds (default: 300000 = 5 minutes)
   */
  constructor(maxSize: number = 1000, defaultTtl: number = 300000) {
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  /**
   * Stores a value in the cache with optional TTL
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time-to-live in milliseconds (optional, uses default if not provided)
   * 
   * @example
   * ```typescript
   * cache.set('user:123:hasRole:admin', true, 60000); // Cache for 1 minute
   * ```
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      ttl: ttl || this.defaultTtl,
      key
    };

    // Remove existing entry to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add new entry
    this.cache.set(key, entry);

    // Evict least recently used entries if cache is full
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Retrieves a value from the cache
   * 
   * @param key - Cache key
   * @returns The cached value or undefined if not found or expired
   * 
   * @example
   * ```typescript
   * const hasRole = cache.get('user:123:hasRole:admin');
   * if (hasRole !== undefined) {
   *   // Use cached value
   * }
   * ```
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Checks if a key exists in the cache and is not expired
   * 
   * @param key - Cache key to check
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Removes a specific entry from the cache
   * 
   * @param key - Cache key to remove
   * @returns True if the entry was removed, false if it didn't exist
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Removes all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Removes all expired entries from the cache
   * This method should be called periodically to prevent memory leaks
   * 
   * @returns Number of entries that were removed
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Gets cache statistics
   * 
   * @returns Object containing cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // This would need hit/miss tracking to implement properly
      expiredEntries
    };
  }

  /**
   * Gets all cache keys (for debugging purposes)
   * 
   * @returns Array of all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Invalidates all cache entries matching a pattern
   * 
   * @param pattern - Regular expression pattern to match keys
   * @returns Number of entries that were invalidated
   * 
   * @example
   * ```typescript
   * // Invalidate all user-specific cache entries
   * cache.invalidatePattern(/^user:123:/);
   * ```
   */
  invalidatePattern(pattern: RegExp): number {
    let removedCount = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Refreshes the TTL of a cache entry without changing its value
   * 
   * @param key - Cache key
   * @param newTtl - New TTL in milliseconds (optional, uses default if not provided)
   * @returns True if the entry was refreshed, false if not found
   */
  refresh(key: string, newTtl?: number): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    entry.timestamp = Date.now();
    entry.ttl = newTtl || this.defaultTtl;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return true;
  }
}
