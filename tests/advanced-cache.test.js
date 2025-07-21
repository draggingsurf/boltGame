/**
 * Unit tests for the Advanced Caching System
 */

// Mock dependencies
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage
});

// Mock performance API
global.performance = {
  now: jest.fn().mockReturnValue(100)
};

// Mock console methods
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Import the module under test
import { LRUCache, cacheAnalytics } from '../app/lib/assets/advanced-cache';

describe('LRUCache', () => {
  let cache;
  
  beforeEach(() => {
    // Reset mocks
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
    console.log.mockReset();
    console.warn.mockReset();
    console.error.mockReset();
    
    // Create a new instance for each test
    cache = new LRUCache({
      name: 'TestCache',
      maxSize: 3,
      ttl: 1000,
      persistToLocalStorage: true,
      logStats: false
    });
  });
  
  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      
      expect(cache.get('key1')).toBe('value1');
    });
    
    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });
    
    it('should enforce max size by removing least recently used items', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Access key1 to make it recently used
      cache.get('key1');
      
      // Add a new item, should evict key2 (least recently used)
      cache.set('key4', 'value4');
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });
    
    it('should respect TTL', () => {
      // Set item with default TTL
      cache.set('key1', 'value1');
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      Date.now = jest.fn().mockReturnValue(Date.now() + 2000); // 2 seconds later
      
      // Item should be expired
      expect(cache.get('key1')).toBeUndefined();
      
      // Restore Date.now
      Date.now = originalNow;
    });
    
    it('should save to localStorage if enabled', () => {
      cache.set('key1', 'value1');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });
  
  describe('has and delete', () => {
    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });
    
    it('should delete key', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      
      expect(cache.has('key1')).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
    
    it('should clear all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.size()).toBe(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });
  
  describe('statistics', () => {
    it('should track hits and misses', () => {
      cache.set('key1', 'value1');
      
      // Hit
      cache.get('key1');
      
      // Miss
      cache.get('nonexistent');
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
    
    it('should track access times', () => {
      cache.set('key1', 'value1');
      
      // Mock performance.now to return different values
      performance.now
        .mockReturnValueOnce(100)  // Start time
        .mockReturnValueOnce(150); // End time
      
      cache.get('key1');
      
      const stats = cache.getStats();
      
      expect(stats.avgAccessTime).toBe(50);
    });
  });
});

describe('CacheAnalytics', () => {
  beforeEach(() => {
    // Reset analytics
    cacheAnalytics.reset();
  });
  
  it('should record hits', () => {
    cacheAnalytics.recordHit(50);
    cacheAnalytics.recordHit(100);
    
    const analytics = cacheAnalytics.getAnalytics();
    
    expect(analytics.hits).toBe(2);
    expect(analytics.misses).toBe(0);
    expect(analytics.hitRate).toBe(1);
    expect(analytics.avgLoadTime).toBe(75);
  });
  
  it('should record misses', () => {
    cacheAnalytics.recordMiss();
    cacheAnalytics.recordMiss();
    
    const analytics = cacheAnalytics.getAnalytics();
    
    expect(analytics.hits).toBe(0);
    expect(analytics.misses).toBe(2);
    expect(analytics.hitRate).toBe(0);
  });
  
  it('should record errors', () => {
    cacheAnalytics.recordError();
    
    const analytics = cacheAnalytics.getAnalytics();
    
    expect(analytics.errors).toBe(1);
  });
  
  it('should reset analytics', () => {
    cacheAnalytics.recordHit(50);
    cacheAnalytics.recordMiss();
    cacheAnalytics.recordError();
    
    cacheAnalytics.reset();
    
    const analytics = cacheAnalytics.getAnalytics();
    
    expect(analytics.hits).toBe(0);
    expect(analytics.misses).toBe(0);
    expect(analytics.errors).toBe(0);
  });
});