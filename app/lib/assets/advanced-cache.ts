/**
 * Advanced Caching System for Dynamic Asset Loading
 * 
 * Provides multi-level caching strategies for optimizing asset loading performance:
 * 1. Memory Cache: Fast in-memory LRU cache for asset URLs and metadata
 * 2. IndexedDB Cache: Persistent browser storage for asset data
 * 3. Service Worker Cache: Network-level caching for assets
 * 4. Cache Warming: Preloading commonly used assets
 * 5. Cache Analytics: Monitoring cache performance
 */

import type { AssetSearchCriteria } from './asset-loader';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expires?: number;
  hits: number;
  lastAccessed: number;
}

/**
 * Cache statistics
 */
interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  avgAccessTime: number;
}

/**
 * Cache configuration
 */
interface CacheConfig {
  name: string;
  maxSize: number;
  ttl: number; // Time to live in ms
  persistToLocalStorage: boolean;
  logStats: boolean;
  statsInterval: number; // Log stats interval in ms
}

/**
 * LRU (Least Recently Used) Cache implementation
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private config: CacheConfig;
  private hits = 0;
  private misses = 0;
  private accessTimes: number[] = [];
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      name: 'LRUCache',
      maxSize: 100,
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      persistToLocalStorage: true,
      logStats: false,
      statsInterval: 60 * 1000, // 1 minute
      ...config
    };

    // Load from localStorage if enabled
    this.loadFromStorage();

    // Start stats logging if enabled
    if (this.config.logStats) {
      this.statsInterval = setInterval(() => {
        console.log(`${this.config.name} Stats:`, this.getStats());
      }, this.config.statsInterval);
    }
  }

  /**
   * Get an item from the cache
   */
  get(key: K): V | undefined {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if entry has expired
    if (entry.expires && entry.expires < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Update entry metadata
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.cache.set(key, entry);
    this.hits++;

    // Track access time
    const accessTime = performance.now() - startTime;
    this.accessTimes.push(accessTime);
    if (this.accessTimes.length > 100) {
      this.accessTimes.shift();
    }

    return entry.value;
  }

  /**
   * Set an item in the cache
   */
  set(key: K, value: V, ttl?: number): void {
    // Enforce max size by removing least recently used items
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const expires = ttl ? Date.now() + ttl : (this.config.ttl ? Date.now() + this.config.ttl : undefined);

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      expires,
      hits: 0,
      lastAccessed: Date.now()
    });

    // Persist to localStorage if enabled
    if (this.config.persistToLocalStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Check if an item exists in the cache
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if entry has expired
    if (entry.expires && entry.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete an item from the cache
   */
  delete(key: K): boolean {
    const result = this.cache.delete(key);

    // Persist to localStorage if enabled
    if (result && this.config.persistToLocalStorage) {
      this.saveToStorage();
    }

    return result;
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.accessTimes = [];

    // Persist to localStorage if enabled
    if (this.config.persistToLocalStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Get the size of the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalAccesses = this.hits + this.misses;
    const hitRate = totalAccesses > 0 ? this.hits / totalAccesses : 0;
    const avgAccessTime = this.accessTimes.length > 0 ?
      this.accessTimes.reduce((sum, time) => sum + time, 0) / this.accessTimes.length :
      0;

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      avgAccessTime
    };
  }

  /**
   * Evict least recently used items
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;

    // Find the least recently used item
    let oldestKey: K | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    // Remove the oldest item
    if (oldestKey !== null) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const serialized = JSON.stringify(Array.from(this.cache.entries()));
      localStorage.setItem(`${this.config.name}_cache`, serialized);
    } catch (error) {
      console.warn(`Failed to save ${this.config.name} to localStorage:`, error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const serialized = localStorage.getItem(`${this.config.name}_cache`);
      if (serialized) {
        const entries = JSON.parse(serialized);
        this.cache = new Map(entries);
      }
    } catch (error) {
      console.warn(`Failed to load ${this.config.name} from localStorage:`, error);
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }
}

/**
 * IndexedDB Cache for storing larger assets
 */
export class IndexedDBCache {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private ready: Promise<boolean>;

  constructor(dbName: string = 'asset-cache', storeName: string = 'assets') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.ready = this.initDB();
  }

  /**
   * Initialize the database
   */
  private async initDB(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not supported');
        resolve(false);
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event);
        resolve(false);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Get an item from the cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    await this.ready;
    if (!this.db) return undefined;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : undefined);
      };

      request.onerror = () => {
        console.error('Error getting from IndexedDB:', request.error);
        resolve(undefined);
      };
    });
  }

  /**
   * Set an item in the cache
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    await this.ready;
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({
        key,
        value,
        timestamp: Date.now()
      });

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error('Error setting in IndexedDB:', request.error);
        resolve(false);
      };
    });
  }

  /**
   * Delete an item from the cache
   */
  async delete(key: string): Promise<boolean> {
    await this.ready;
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error('Error deleting from IndexedDB:', request.error);
        resolve(false);
      };
    });
  }

  /**
   * Clear the cache
   */
  async clear(): Promise<boolean> {
    await this.ready;
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error('Error clearing IndexedDB:', request.error);
        resolve(false);
      };
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Service Worker Cache for network-level caching
 */
export class ServiceWorkerCache {
  private cacheName: string;
  private ready: Promise<boolean>;

  constructor(cacheName: string = 'asset-cache') {
    this.cacheName = cacheName;
    this.ready = this.initCache();
  }

  /**
   * Initialize the cache
   */
  private async initCache(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('caches' in window)) {
      console.warn('Service Worker or Cache API not supported');
      return false;
    }

    try {
      // Ensure the cache exists
      await caches.open(this.cacheName);
      return true;
    } catch (error) {
      console.error('Error initializing Service Worker Cache:', error);
      return false;
    }
  }

  /**
   * Get an item from the cache
   */
  async get(url: string): Promise<Response | undefined> {
    const isReady = await this.ready;
    if (!isReady) return undefined;

    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(url);
      return response || undefined;
    } catch (error) {
      console.error('Error getting from Service Worker Cache:', error);
      return undefined;
    }
  }

  /**
   * Set an item in the cache
   */
  async set(url: string, response: Response): Promise<boolean> {
    const isReady = await this.ready;
    if (!isReady) return false;

    try {
      const cache = await caches.open(this.cacheName);
      await cache.put(url, response.clone());
      return true;
    } catch (error) {
      console.error('Error setting in Service Worker Cache:', error);
      return false;
    }
  }

  /**
   * Delete an item from the cache
   */
  async delete(url: string): Promise<boolean> {
    const isReady = await this.ready;
    if (!isReady) return false;

    try {
      const cache = await caches.open(this.cacheName);
      return await cache.delete(url);
    } catch (error) {
      console.error('Error deleting from Service Worker Cache:', error);
      return false;
    }
  }

  /**
   * Clear the cache
   */
  async clear(): Promise<boolean> {
    const isReady = await this.ready;
    if (!isReady) return false;

    try {
      await caches.delete(this.cacheName);
      return true;
    } catch (error) {
      console.error('Error clearing Service Worker Cache:', error);
      return false;
    }
  }

  /**
   * Prefetch URLs into the cache
   */
  async prefetch(urls: string[]): Promise<number> {
    const isReady = await this.ready;
    if (!isReady) return 0;

    try {
      const cache = await caches.open(this.cacheName);
      const results = await Promise.allSettled(
        urls.map(url => fetch(url).then(response => {
          if (response.ok) {
            return cache.put(url, response);
          }
          throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }))
      );

      // Count successful prefetches
      return results.filter(result => result.status === 'fulfilled').length;
    } catch (error) {
      console.error('Error prefetching URLs:', error);
      return 0;
    }
  }
}

/**
 * Multi-level cache that combines memory, IndexedDB, and Service Worker caches
 */
export class MultiLevelCache {
  private memoryCache: LRUCache<string, any>;
  private indexedDBCache: IndexedDBCache;
  private serviceWorkerCache: ServiceWorkerCache;
  private config: {
    useMemoryCache: boolean;
    useIndexedDBCache: boolean;
    useServiceWorkerCache: boolean;
    prefetchCommonAssets: boolean;
    logCacheHits: boolean;
  };

  constructor(config?: Partial<typeof MultiLevelCache.prototype.config>) {
    this.config = {
      useMemoryCache: true,
      useIndexedDBCache: true,
      useServiceWorkerCache: true,
      prefetchCommonAssets: true,
      logCacheHits: false,
      ...config
    };

    // Initialize caches
    this.memoryCache = new LRUCache({
      name: 'AssetMemoryCache',
      maxSize: 200,
      ttl: 30 * 60 * 1000, // 30 minutes
      persistToLocalStorage: true,
      logStats: this.config.logCacheHits
    });

    this.indexedDBCache = new IndexedDBCache('asset-cache', 'assets');
    this.serviceWorkerCache = new ServiceWorkerCache('asset-cache');

    // Prefetch common assets if enabled
    if (this.config.prefetchCommonAssets) {
      this.prefetchCommonAssets();
    }
  }

  /**
   * Get an asset from the cache
   */
  async get<T>(key: string, fetchFn?: () => Promise<T>): Promise<T | undefined> {
    // Try memory cache first (fastest)
    if (this.config.useMemoryCache) {
      const memoryResult = this.memoryCache.get(key);
      if (memoryResult !== undefined) {
        if (this.config.logCacheHits) {
          console.log(`🔍 Memory cache hit: ${key}`);
        }
        return memoryResult;
      }
    }

    // Try IndexedDB cache next
    if (this.config.useIndexedDBCache) {
      const indexedDBResult = await this.indexedDBCache.get<T>(key);
      if (indexedDBResult !== undefined) {
        if (this.config.logCacheHits) {
          console.log(`🔍 IndexedDB cache hit: ${key}`);
        }
        // Store in memory cache for faster access next time
        if (this.config.useMemoryCache) {
          this.memoryCache.set(key, indexedDBResult);
        }
        return indexedDBResult;
      }
    }

    // Try Service Worker cache for URLs
    if (this.config.useServiceWorkerCache && key.startsWith('http')) {
      const swResult = await this.serviceWorkerCache.get(key);
      if (swResult) {
        if (this.config.logCacheHits) {
          console.log(`🔍 Service Worker cache hit: ${key}`);
        }
        try {
          // For JSON responses
          const data = await swResult.clone().json();
          // Store in memory and IndexedDB caches for faster access next time
          if (this.config.useMemoryCache) {
            this.memoryCache.set(key, data);
          }
          if (this.config.useIndexedDBCache) {
            await this.indexedDBCache.set(key, data);
          }
          return data as T;
        } catch {
          // For non-JSON responses (like images)
          return swResult as unknown as T;
        }
      }
    }

    // If not found in any cache and fetchFn is provided, fetch and cache
    if (fetchFn) {
      try {
        const fetchedData = await fetchFn();
        
        // Cache the fetched data
        if (this.config.useMemoryCache) {
          this.memoryCache.set(key, fetchedData);
        }
        if (this.config.useIndexedDBCache) {
          await this.indexedDBCache.set(key, fetchedData);
        }
        if (this.config.useServiceWorkerCache && key.startsWith('http') && fetchedData instanceof Response) {
          await this.serviceWorkerCache.set(key, fetchedData.clone());
        }
        
        return fetchedData;
      } catch (error) {
        console.error(`Error fetching data for key ${key}:`, error);
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Set an asset in the cache
   */
  async set<T>(key: string, value: T): Promise<void> {
    // Store in memory cache
    if (this.config.useMemoryCache) {
      this.memoryCache.set(key, value);
    }

    // Store in IndexedDB cache
    if (this.config.useIndexedDBCache) {
      await this.indexedDBCache.set(key, value);
    }

    // Store in Service Worker cache if it's a Response
    if (this.config.useServiceWorkerCache && key.startsWith('http') && value instanceof Response) {
      await this.serviceWorkerCache.set(key, value);
    }
  }

  /**
   * Delete an asset from the cache
   */
  async delete(key: string): Promise<void> {
    // Delete from memory cache
    if (this.config.useMemoryCache) {
      this.memoryCache.delete(key);
    }

    // Delete from IndexedDB cache
    if (this.config.useIndexedDBCache) {
      await this.indexedDBCache.delete(key);
    }

    // Delete from Service Worker cache
    if (this.config.useServiceWorkerCache && key.startsWith('http')) {
      await this.serviceWorkerCache.delete(key);
    }
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    // Clear memory cache
    if (this.config.useMemoryCache) {
      this.memoryCache.clear();
    }

    // Clear IndexedDB cache
    if (this.config.useIndexedDBCache) {
      await this.indexedDBCache.clear();
    }

    // Clear Service Worker cache
    if (this.config.useServiceWorkerCache) {
      await this.serviceWorkerCache.clear();
    }
  }

  /**
   * Prefetch common assets
   */
  private async prefetchCommonAssets(): Promise<void> {
    // Common asset types to prefetch
    const commonAssetTypes = [
      { subcategory: 'characters', tags: ['beige', 'idle'] },
      { subcategory: 'enemies', tags: ['slime'] },
      { subcategory: 'tiles', tags: ['grass'] },
      { name: 'coin' },
      { subcategory: 'backgrounds', name: 'hills' }
    ];

    // Import assetLoader dynamically to avoid circular dependencies
    try {
      const { assetLoader } = await import('./asset-loader');
      
      // Prefetch common assets
      const urls: string[] = [];
      
      for (const criteria of commonAssetTypes) {
        const url = await assetLoader.getAssetUrl(criteria);
        if (url) {
          urls.push(url);
        }
      }
      
      // Prefetch URLs into Service Worker cache
      if (this.config.useServiceWorkerCache && urls.length > 0) {
        const count = await this.serviceWorkerCache.prefetch(urls);
        console.log(`✅ Prefetched ${count}/${urls.length} common assets`);
      }
    } catch (error) {
      console.warn('Failed to prefetch common assets:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memory: CacheStats | null;
    indexedDB: boolean;
    serviceWorker: boolean;
  } {
    return {
      memory: this.config.useMemoryCache ? this.memoryCache.getStats() : null,
      indexedDB: this.config.useIndexedDBCache,
      serviceWorker: this.config.useServiceWorkerCache
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.config.useMemoryCache) {
      this.memoryCache.dispose();
    }
    if (this.config.useIndexedDBCache) {
      this.indexedDBCache.close();
    }
  }
}

// Export singleton instance
export const multiLevelCache = new MultiLevelCache();

/**
 * Cache warmer for preloading assets
 */
export class CacheWarmer {
  private assetLoader: any;
  private cache: MultiLevelCache;
  
  constructor(cache: MultiLevelCache = multiLevelCache) {
    this.cache = cache;
  }
  
  /**
   * Initialize the cache warmer
   */
  async initialize(): Promise<void> {
    // Import assetLoader dynamically to avoid circular dependencies
    try {
      const module = await import('./asset-loader');
      this.assetLoader = module.assetLoader;
    } catch (error) {
      console.error('Failed to import assetLoader:', error);
    }
  }
  
  /**
   * Warm up the cache with common assets
   */
  async warmCache(options: {
    characters?: boolean;
    enemies?: boolean;
    tiles?: boolean;
    backgrounds?: boolean;
    limit?: number;
  } = {}): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    if (!this.assetLoader) {
      await this.initialize();
    }
    
    const result = {
      total: 0,
      success: 0,
      failed: 0
    };
    
    const limit = options.limit || 5;
    
    // Warm up character assets
    if (options.characters !== false) {
      const characterColors = ['beige', 'blue', 'green', 'pink', 'yellow'];
      const characterAnimations = ['idle', 'walk', 'jump'];
      
      for (const color of characterColors) {
        for (const animation of characterAnimations) {
          result.total++;
          try {
            const url = await this.assetLoader.getPlayerSprite(color, animation);
            if (url) {
              await this.cache.set(`character:${color}:${animation}`, url);
              result.success++;
            } else {
              result.failed++;
            }
          } catch (error) {
            result.failed++;
          }
          
          // Respect limit
          if (result.total >= limit) break;
        }
        if (result.total >= limit) break;
      }
    }
    
    // Warm up enemy assets
    if (options.enemies !== false && result.total < limit) {
      const enemyTypes = ['slime', 'bee', 'frog', 'mouse', 'fish'];
      
      for (const enemyType of enemyTypes) {
        result.total++;
        try {
          const url = await this.assetLoader.getEnemySprite(enemyType);
          if (url) {
            await this.cache.set(`enemy:${enemyType}`, url);
            result.success++;
          } else {
            result.failed++;
          }
        } catch (error) {
          result.failed++;
        }
        
        // Respect limit
        if (result.total >= limit) break;
      }
    }
    
    // Warm up tile assets
    if (options.tiles !== false && result.total < limit) {
      const tileTypes = ['grass', 'dirt', 'sand', 'stone'];
      
      for (const tileType of tileTypes) {
        result.total++;
        try {
          const url = await this.assetLoader.getTileSprite(tileType);
          if (url) {
            await this.cache.set(`tile:${tileType}`, url);
            result.success++;
          } else {
            result.failed++;
          }
        } catch (error) {
          result.failed++;
        }
        
        // Respect limit
        if (result.total >= limit) break;
      }
    }
    
    // Warm up background assets
    if (options.backgrounds !== false && result.total < limit) {
      const backgroundTypes = ['hills', 'desert', 'trees', 'mushrooms'];
      
      for (const bgType of backgroundTypes) {
        result.total++;
        try {
          const url = await this.assetLoader.getBackgroundSprite(bgType);
          if (url) {
            await this.cache.set(`background:${bgType}`, url);
            result.success++;
          } else {
            result.failed++;
          }
        } catch (error) {
          result.failed++;
        }
        
        // Respect limit
        if (result.total >= limit) break;
      }
    }
    
    return result;
  }
  
  /**
   * Warm up the cache with specific assets
   */
  async warmSpecificAssets(criteria: AssetSearchCriteria[]): Promise<{
    total: number;
    success: number;
    failed: number;
  }> {
    if (!this.assetLoader) {
      await this.initialize();
    }
    
    const result = {
      total: criteria.length,
      success: 0,
      failed: 0
    };
    
    for (const criterion of criteria) {
      try {
        const assets = await this.assetLoader.searchAssets(criterion);
        if (assets.length > 0) {
          // Cache the first asset
          const asset = assets[0];
          await this.cache.set(`asset:${asset.id}`, asset.url);
          result.success++;
        } else {
          result.failed++;
        }
      } catch (error) {
        result.failed++;
      }
    }
    
    return result;
  }
}

// Export singleton instance
export const cacheWarmer = new CacheWarmer();

/**
 * Cache analytics for monitoring cache performance
 */
export class CacheAnalytics {
  private cache: MultiLevelCache;
  private metrics: {
    hits: number;
    misses: number;
    loadTimes: number[];
    errors: number;
    lastUpdated: number;
  };
  
  constructor(cache: MultiLevelCache = multiLevelCache) {
    this.cache = cache;
    this.metrics = {
      hits: 0,
      misses: 0,
      loadTimes: [],
      errors: 0,
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Record a cache hit
   */
  recordHit(loadTime: number): void {
    this.metrics.hits++;
    this.metrics.loadTimes.push(loadTime);
    this.metrics.lastUpdated = Date.now();
    
    // Keep only the last 100 load times
    if (this.metrics.loadTimes.length > 100) {
      this.metrics.loadTimes.shift();
    }
  }
  
  /**
   * Record a cache miss
   */
  recordMiss(): void {
    this.metrics.misses++;
    this.metrics.lastUpdated = Date.now();
  }
  
  /**
   * Record an error
   */
  recordError(): void {
    this.metrics.errors++;
    this.metrics.lastUpdated = Date.now();
  }
  
  /**
   * Get cache analytics
   */
  getAnalytics(): {
    hits: number;
    misses: number;
    hitRate: number;
    avgLoadTime: number;
    errors: number;
    cacheStats: ReturnType<typeof MultiLevelCache.prototype.getStats>;
    lastUpdated: number;
  } {
    const totalAccesses = this.metrics.hits + this.metrics.misses;
    const hitRate = totalAccesses > 0 ? this.metrics.hits / totalAccesses : 0;
    const avgLoadTime = this.metrics.loadTimes.length > 0 ?
      this.metrics.loadTimes.reduce((sum, time) => sum + time, 0) / this.metrics.loadTimes.length :
      0;
    
    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate,
      avgLoadTime,
      errors: this.metrics.errors,
      cacheStats: this.cache.getStats(),
      lastUpdated: this.metrics.lastUpdated
    };
  }
  
  /**
   * Reset analytics
   */
  reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      loadTimes: [],
      errors: 0,
      lastUpdated: Date.now()
    };
  }
}

// Export singleton instance
export const cacheAnalytics = new CacheAnalytics();