/**
 * Unit tests for the Performance Optimizer
 */

// Mock dependencies
jest.mock('../app/lib/assets/asset-loader', () => ({
  assetLoader: {
    getAssetUrl: jest.fn()
  }
}));

// Import mocked dependencies
import { assetLoader } from '../app/lib/assets/asset-loader';

// Mock console methods
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Import the module under test
import { 
  PerformanceOptimizer, 
  AssetPriority,
  loadParallel,
  loadLazy
} from '../app/lib/assets/performance-optimizer';

describe('PerformanceOptimizer', () => {
  let optimizer;
  
  beforeEach(() => {
    // Reset mocks
    assetLoader.getAssetUrl.mockReset();
    console.log.mockReset();
    console.warn.mockReset();
    console.error.mockReset();
    
    // Create a new instance for each test
    optimizer = new PerformanceOptimizer({
      maxConcurrent: 3,
      retryFailed: true,
      maxRetries: 1,
      timeout: 1000,
      priorityOrder: true,
      abortOnError: false
    });
  });
  
  describe('loadAssets', () => {
    it('should load assets in parallel', async () => {
      // Mock successful asset loading
      assetLoader.getAssetUrl
        .mockResolvedValueOnce('url1')
        .mockResolvedValueOnce('url2')
        .mockResolvedValueOnce('url3');
      
      const assets = [
        { key: 'asset1', criteria: { name: 'asset1' }, priority: AssetPriority.MEDIUM },
        { key: 'asset2', criteria: { name: 'asset2' }, priority: AssetPriority.MEDIUM },
        { key: 'asset3', criteria: { name: 'asset3' }, priority: AssetPriority.MEDIUM }
      ];
      
      const results = await optimizer.loadAssets(assets);
      
      expect(results.size).toBe(3);
      expect(results.get('asset1')).toBe('url1');
      expect(results.get('asset2')).toBe('url2');
      expect(results.get('asset3')).toBe('url3');
      expect(assetLoader.getAssetUrl).toHaveBeenCalledTimes(3);
    });
    
    it('should respect maxConcurrent limit', async () => {
      // Mock slow asset loading
      assetLoader.getAssetUrl.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'url';
      });
      
      // Create 6 assets
      const assets = Array.from({ length: 6 }, (_, i) => ({
        key: `asset${i + 1}`,
        criteria: { name: `asset${i + 1}` },
        priority: AssetPriority.MEDIUM
      }));
      
      // Start loading
      const loadPromise = optimizer.loadAssets(assets);
      
      // Wait a bit to allow some assets to start loading
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // At this point, only maxConcurrent (3) assets should be loading
      expect(assetLoader.getAssetUrl).toHaveBeenCalledTimes(3);
      
      // Wait for all assets to load
      await loadPromise;
      
      // All assets should be loaded
      expect(assetLoader.getAssetUrl).toHaveBeenCalledTimes(6);
    });
    
    it('should sort assets by priority', async () => {
      // Mock asset loading
      assetLoader.getAssetUrl.mockResolvedValue('url');
      
      const assets = [
        { key: 'asset1', criteria: { name: 'asset1' }, priority: AssetPriority.LOW },
        { key: 'asset2', criteria: { name: 'asset2' }, priority: AssetPriority.CRITICAL },
        { key: 'asset3', criteria: { name: 'asset3' }, priority: AssetPriority.MEDIUM },
        { key: 'asset4', criteria: { name: 'asset4' }, priority: AssetPriority.HIGH }
      ];
      
      await optimizer.loadAssets(assets);
      
      // Check the order of calls
      expect(assetLoader.getAssetUrl.mock.calls[0][0]).toEqual({ name: 'asset2' }); // CRITICAL
      expect(assetLoader.getAssetUrl.mock.calls[1][0]).toEqual({ name: 'asset4' }); // HIGH
      expect(assetLoader.getAssetUrl.mock.calls[2][0]).toEqual({ name: 'asset3' }); // MEDIUM
      expect(assetLoader.getAssetUrl.mock.calls[3][0]).toEqual({ name: 'asset1' }); // LOW
    });
    
    it('should retry failed assets', async () => {
      // Mock asset loading to fail once then succeed
      assetLoader.getAssetUrl
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce('url');
      
      const assets = [
        { key: 'asset1', criteria: { name: 'asset1' }, priority: AssetPriority.MEDIUM }
      ];
      
      const results = await optimizer.loadAssets(assets);
      
      expect(results.size).toBe(1);
      expect(results.get('asset1')).toBe('url');
      expect(assetLoader.getAssetUrl).toHaveBeenCalledTimes(2);
    });
    
    it('should handle timeout', async () => {
      // Mock asset loading to never resolve
      assetLoader.getAssetUrl.mockImplementation(() => new Promise(() => {}));
      
      // Set a short timeout
      optimizer = new PerformanceOptimizer({
        timeout: 50,
        retryFailed: false
      });
      
      const assets = [
        { key: 'asset1', criteria: { name: 'asset1' }, priority: AssetPriority.MEDIUM }
      ];
      
      const results = await optimizer.loadAssets(assets);
      
      expect(results.size).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
    
    it('should abort loading if configured', async () => {
      // Mock asset loading to fail
      assetLoader.getAssetUrl.mockRejectedValue(new Error('Failed'));
      
      // Configure to abort on error
      optimizer = new PerformanceOptimizer({
        retryFailed: false,
        abortOnError: true
      });
      
      const assets = [
        { key: 'asset1', criteria: { name: 'asset1' }, priority: AssetPriority.MEDIUM },
        { key: 'asset2', criteria: { name: 'asset2' }, priority: AssetPriority.MEDIUM }
      ];
      
      const results = await optimizer.loadAssets(assets);
      
      expect(results.size).toBe(0);
      // Only the first asset should be attempted
      expect(assetLoader.getAssetUrl).toHaveBeenCalledTimes(1);
    });
    
    it('should call progress callback', async () => {
      // Mock successful asset loading
      assetLoader.getAssetUrl.mockResolvedValue('url');
      
      const progressCallback = jest.fn();
      
      optimizer = new PerformanceOptimizer({
        progressCallback
      });
      
      const assets = [
        { key: 'asset1', criteria: { name: 'asset1' }, priority: AssetPriority.MEDIUM },
        { key: 'asset2', criteria: { name: 'asset2' }, priority: AssetPriority.MEDIUM }
      ];
      
      await optimizer.loadAssets(assets);
      
      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenLastCalledWith(1, 2, 2); // 100% progress
    });
  });
  
  describe('asset bundles', () => {
    it('should create and load asset bundles', async () => {
      // Mock successful asset loading
      assetLoader.getAssetUrl.mockResolvedValue('url');
      
      const assets = [
        { key: 'asset1', criteria: { name: 'asset1' }, priority: AssetPriority.MEDIUM },
        { key: 'asset2', criteria: { name: 'asset2' }, priority: AssetPriority.MEDIUM }
      ];
      
      const bundle = optimizer.createBundle('test-bundle', assets, AssetPriority.HIGH);
      
      expect(bundle.name).toBe('test-bundle');
      expect(bundle.assets).toBe(assets);
      expect(bundle.priority).toBe(AssetPriority.HIGH);
      expect(bundle.progress).toBe(0);
      expect(bundle.loaded).toBe(false);
      
      const results = await optimizer.loadBundle(bundle);
      
      expect(results.size).toBe(2);
      expect(bundle.progress).toBe(1);
      expect(bundle.loaded).toBe(true);
    });
  });
});

describe('utility functions', () => {
  beforeEach(() => {
    // Reset mocks
    assetLoader.getAssetUrl.mockReset();
  });
  
  describe('loadParallel', () => {
    it('should load assets in parallel', async () => {
      // Mock successful asset loading
      assetLoader.getAssetUrl.mockResolvedValue('url');
      
      const assets = [
        { key: 'asset1', criteria: { name: 'asset1' }, priority: AssetPriority.MEDIUM },
        { key: 'asset2', criteria: { name: 'asset2' }, priority: AssetPriority.MEDIUM }
      ];
      
      const results = await loadParallel(assets);
      
      expect(results.size).toBe(2);
      expect(assetLoader.getAssetUrl).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('loadLazy', () => {
    it('should load assets with minimal concurrency', async () => {
      // Mock slow asset loading
      assetLoader.getAssetUrl.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'url';
      });
      
      // Create 4 assets
      const assets = Array.from({ length: 4 }, (_, i) => ({
        key: `asset${i + 1}`,
        criteria: { name: `asset${i + 1}` },
        priority: AssetPriority.MEDIUM
      }));
      
      // Start loading
      const loadPromise = loadLazy(assets);
      
      // Wait a bit to allow some assets to start loading
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // At this point, only 2 assets should be loading (default for lazy loading)
      expect(assetLoader.getAssetUrl).toHaveBeenCalledTimes(2);
      
      // Wait for all assets to load
      await loadPromise;
      
      // All assets should be loaded
      expect(assetLoader.getAssetUrl).toHaveBeenCalledTimes(4);
    });
  });
});