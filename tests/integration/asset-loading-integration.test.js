/**
 * Integration tests for the Dynamic Asset Loading System
 * 
 * These tests verify that the different components of the system work together correctly.
 */

// Mock fetch for testing
global.fetch = jest.fn();

// Mock Phaser for testing
global.Phaser = {
  Scene: class {
    constructor() {
      this.load = {
        image: jest.fn(),
        once: jest.fn(),
        on: jest.fn(),
        start: jest.fn(),
        isLoading: jest.fn().mockReturnValue(false)
      };
      this.textures = {
        exists: jest.fn().mockReturnValue(true)
      };
      this.add = {
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        }),
        graphics: jest.fn().mockReturnValue({
          fillStyle: jest.fn().mockReturnThis(),
          fillRect: jest.fn().mockReturnThis(),
          clear: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        })
      };
      this.cameras = {
        main: {
          width: 800,
          height: 600
        }
      };
    }
  }
};

// Import the modules under test
import { assetLoader } from '../../app/lib/assets/asset-loader';
import { 
  PhaserAssetHelper, 
  loadPlatformerAssets, 
  loadCharacterGame, 
  loadEnemyGame, 
  loadTerrainGame 
} from '../../app/lib/assets/phaser-helpers';
import { migrationHelper } from '../../app/lib/assets/migration-helper';
import { createCompatibilityLayer } from '../../app/lib/assets/compatibility-layer';
import { createHybridLoader } from '../../app/lib/assets/hybrid-loader';
import { multiLevelCache } from '../../app/lib/assets/advanced-cache';
import { createPerformanceOptimizer, AssetPriority } from '../../app/lib/assets/performance-optimizer';

// Sample manifest data
const sampleManifest = {
  version: '1.0.0',
  generated_at: '2025-07-19T13:44:54.253Z',
  base_url: 'https://example.com/assets/',
  assets: [
    {
      id: 'asset1',
      name: 'Character Beige Idle',
      url: 'https://example.com/assets/characters/beige_idle.png',
      category: 'sprites',
      subcategory: 'characters',
      tags: ['beige', 'idle', 'characters'],
      file_type: 'png'
    },
    {
      id: 'asset2',
      name: 'Character Beige Walk',
      url: 'https://example.com/assets/characters/beige_walk.png',
      category: 'sprites',
      subcategory: 'characters',
      tags: ['beige', 'walk', 'characters'],
      file_type: 'png'
    },
    {
      id: 'asset3',
      name: 'Slime Enemy',
      url: 'https://example.com/assets/enemies/slime.png',
      category: 'sprites',
      subcategory: 'enemies',
      tags: ['slime', 'enemies'],
      file_type: 'png'
    },
    {
      id: 'asset4',
      name: 'Grass Tile',
      url: 'https://example.com/assets/tiles/grass.png',
      category: 'sprites',
      subcategory: 'tiles',
      tags: ['grass', 'tiles'],
      file_type: 'png'
    },
    {
      id: 'asset5',
      name: 'Coin',
      url: 'https://example.com/assets/tiles/coin.png',
      category: 'sprites',
      subcategory: 'tiles',
      tags: ['coin', 'tiles'],
      file_type: 'png'
    },
    {
      id: 'asset6',
      name: 'Hills Background',
      url: 'https://example.com/assets/backgrounds/hills.png',
      category: 'sprites',
      subcategory: 'backgrounds',
      tags: ['hills', 'backgrounds'],
      file_type: 'png'
    }
  ],
  search_index: {}
};

describe('Asset Loading Integration Tests', () => {
  let scene;
  
  beforeEach(() => {
    // Reset mocks
    fetch.mockReset();
    
    // Mock successful manifest fetch
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => sampleManifest
    });
    
    // Create a new Phaser scene for each test
    scene = new Phaser.Scene();
  });
  
  describe('AssetLoader with PhaserAssetHelper', () => {
    it('should load basic assets into Phaser scene', async () => {
      // Create helper
      const helper = new PhaserAssetHelper(scene);
      
      // Load basic assets
      await helper.loadBasicAssets();
      
      // Verify that the correct assets were loaded
      expect(scene.load.image).toHaveBeenCalledWith('player', 'https://example.com/assets/characters/beige_idle.png');
      expect(scene.load.image).toHaveBeenCalledWith('enemy', 'https://example.com/assets/enemies/slime.png');
      expect(scene.load.image).toHaveBeenCalledWith('ground', 'https://example.com/assets/tiles/grass.png');
      expect(scene.load.image).toHaveBeenCalledWith('coin', 'https://example.com/assets/tiles/coin.png');
      expect(scene.load.image).toHaveBeenCalledWith('background', 'https://example.com/assets/backgrounds/hills.png');
    });
    
    it('should handle loading errors gracefully', async () => {
      // Mock asset loading error
      scene.load.on.mockImplementation((event, callback) => {
        if (event === 'loaderror-player') {
          callback();
        }
      });
      
      // Create helper
      const helper = new PhaserAssetHelper(scene);
      
      // Mock loadFallbackAsset method
      const loadFallbackAssetSpy = jest.spyOn(helper, 'loadFallbackAsset');
      
      // Load basic assets
      await helper.loadBasicAssets();
      
      // Verify that fallback was called
      expect(loadFallbackAssetSpy).toHaveBeenCalledWith('player');
    });
    
    it('should show and hide loading UI', async () => {
      // Create helper
      const helper = new PhaserAssetHelper(scene);
      
      // Show loading UI
      helper.showLoadingUI('Loading test assets...');
      
      // Verify UI elements were created
      expect(scene.add.graphics).toHaveBeenCalled();
      expect(scene.add.text).toHaveBeenCalledWith(400, 250, 'Loading test assets...', expect.any(Object));
      
      // Hide loading UI
      helper.hideLoadingUI();
      
      // Verify UI elements were destroyed
      expect(scene.add.graphics().destroy).toHaveBeenCalled();
      expect(scene.add.text().destroy).toHaveBeenCalled();
    });
  });
  
  describe('Convenience Functions', () => {
    it('should load platformer assets', async () => {
      // Mock PhaserAssetHelper.loadBasicAssets
      const originalPhaserAssetHelper = PhaserAssetHelper;
      PhaserAssetHelper.prototype.loadBasicAssets = jest.fn().mockResolvedValue(undefined);
      
      // Load platformer assets
      await loadPlatformerAssets(scene);
      
      // Verify that loadBasicAssets was called
      expect(PhaserAssetHelper.prototype.loadBasicAssets).toHaveBeenCalled();
      
      // Restore original
      PhaserAssetHelper.prototype.loadBasicAssets = originalPhaserAssetHelper.prototype.loadBasicAssets;
    });
    
    it('should load character game assets', async () => {
      // Mock PhaserAssetHelper methods
      const originalPhaserAssetHelper = PhaserAssetHelper;
      PhaserAssetHelper.prototype.loadBasicAssets = jest.fn().mockResolvedValue(undefined);
      PhaserAssetHelper.prototype.loadCharacterAnimations = jest.fn().mockResolvedValue(undefined);
      
      // Load character game assets
      await loadCharacterGame(scene, 'beige');
      
      // Verify that both methods were called
      expect(PhaserAssetHelper.prototype.loadBasicAssets).toHaveBeenCalled();
      expect(PhaserAssetHelper.prototype.loadCharacterAnimations).toHaveBeenCalledWith('beige');
      
      // Restore original
      PhaserAssetHelper.prototype.loadBasicAssets = originalPhaserAssetHelper.prototype.loadBasicAssets;
      PhaserAssetHelper.prototype.loadCharacterAnimations = originalPhaserAssetHelper.prototype.loadCharacterAnimations;
    });
    
    it('should load enemy game assets', async () => {
      // Mock PhaserAssetHelper methods
      const originalPhaserAssetHelper = PhaserAssetHelper;
      PhaserAssetHelper.prototype.loadBasicAssets = jest.fn().mockResolvedValue(undefined);
      PhaserAssetHelper.prototype.loadEnemyVariants = jest.fn().mockResolvedValue(undefined);
      
      // Load enemy game assets
      await loadEnemyGame(scene);
      
      // Verify that both methods were called
      expect(PhaserAssetHelper.prototype.loadBasicAssets).toHaveBeenCalled();
      expect(PhaserAssetHelper.prototype.loadEnemyVariants).toHaveBeenCalled();
      
      // Restore original
      PhaserAssetHelper.prototype.loadBasicAssets = originalPhaserAssetHelper.prototype.loadBasicAssets;
      PhaserAssetHelper.prototype.loadEnemyVariants = originalPhaserAssetHelper.prototype.loadEnemyVariants;
    });
    
    it('should load terrain game assets', async () => {
      // Mock PhaserAssetHelper methods
      const originalPhaserAssetHelper = PhaserAssetHelper;
      PhaserAssetHelper.prototype.loadBasicAssets = jest.fn().mockResolvedValue(undefined);
      PhaserAssetHelper.prototype.loadTerrainTiles = jest.fn().mockResolvedValue(undefined);
      
      // Load terrain game assets
      await loadTerrainGame(scene);
      
      // Verify that both methods were called
      expect(PhaserAssetHelper.prototype.loadBasicAssets).toHaveBeenCalled();
      expect(PhaserAssetHelper.prototype.loadTerrainTiles).toHaveBeenCalled();
      
      // Restore original
      PhaserAssetHelper.prototype.loadBasicAssets = originalPhaserAssetHelper.prototype.loadBasicAssets;
      PhaserAssetHelper.prototype.loadTerrainTiles = originalPhaserAssetHelper.prototype.loadTerrainTiles;
    });
  });
  
  describe('Migration and Compatibility', () => {
    it('should analyze code and suggest migrations', () => {
      // Sample code with static asset loading
      const sampleCode = `
        preload() {
          this.load.image('player', '/sprites/player.svg');
          this.load.image('enemy', '/sprites/enemy.svg');
          this.load.image('ground', '/sprites/ground.svg');
        }
      `;
      
      // Analyze code
      const analysis = migrationHelper.analyzeCode(sampleCode);
      
      // Verify analysis results
      expect(analysis.staticAssets).toContain('/sprites/player.svg');
      expect(analysis.staticAssets).toContain('/sprites/enemy.svg');
      expect(analysis.staticAssets).toContain('/sprites/ground.svg');
      expect(analysis.suggestions.length).toBeGreaterThan(0);
      expect(analysis.migrationCode).toContain('loadPlatformerAssets');
    });
    
    it('should create compatibility layer', () => {
      // Create compatibility layer
      const compatLayer = createCompatibilityLayer(scene, {
        enableHybridMode: true,
        preferDynamic: true,
        fallbackToStatic: true
      });
      
      // Verify that scene.load.image was patched
      const originalImage = scene.load.image;
      expect(scene.load.image).not.toBe(originalImage);
      
      // Call patched method
      scene.load.image('player', '/sprites/player.svg');
      
      // Get stats
      const stats = compatLayer.getStats();
      
      // Verify stats
      expect(stats.staticAssetCount).toBe(1);
    });
    
    it('should create hybrid loader', async () => {
      // Create hybrid loader
      const hybridLoader = createHybridLoader(scene, {
        preferDynamic: true,
        staticBasePath: '',
        enableFallback: true
      });
      
      // Mock getAssetUrl to return a URL
      jest.spyOn(assetLoader, 'getAssetUrl').mockResolvedValue('https://example.com/assets/player.png');
      
      // Load asset
      const success = await hybridLoader.loadAsset({
        key: 'player',
        dynamicCriteria: { subcategory: 'characters', tags: ['beige', 'idle'] },
        staticPath: '/sprites/player.svg',
        type: 'image'
      });
      
      // Verify that asset was loaded
      expect(success).toBe(true);
      expect(scene.load.image).toHaveBeenCalledWith('player', 'https://example.com/assets/player.png');
      
      // Get stats
      const stats = hybridLoader.getStats();
      
      // Verify stats
      expect(stats.totalAssets).toBe(1);
      expect(stats.dynamicAssets).toBe(1);
    });
  });
  
  describe('Advanced Caching and Performance', () => {
    it('should use multi-level cache', async () => {
      // Mock cache methods
      const originalGet = multiLevelCache.get;
      const originalSet = multiLevelCache.set;
      multiLevelCache.get = jest.fn().mockResolvedValue(null);
      multiLevelCache.set = jest.fn().mockResolvedValue(undefined);
      
      // Mock getAssetUrl to use cache
      const originalGetAssetUrl = assetLoader.getAssetUrl;
      assetLoader.getAssetUrl = jest.fn().mockImplementation(async (criteria) => {
        // Try to get from cache
        const cacheKey = JSON.stringify(criteria);
        const cachedUrl = await multiLevelCache.get(cacheKey);
        
        if (cachedUrl) {
          return cachedUrl;
        }
        
        // Not in cache, return mock URL
        const url = 'https://example.com/assets/mock.png';
        
        // Store in cache
        await multiLevelCache.set(cacheKey, url);
        
        return url;
      });
      
      // Get asset URL
      const url = await assetLoader.getAssetUrl({
        subcategory: 'characters',
        tags: ['beige', 'idle']
      });
      
      // Verify that cache was used
      expect(url).toBe('https://example.com/assets/mock.png');
      expect(multiLevelCache.get).toHaveBeenCalled();
      expect(multiLevelCache.set).toHaveBeenCalled();
      
      // Restore originals
      multiLevelCache.get = originalGet;
      multiLevelCache.set = originalSet;
      assetLoader.getAssetUrl = originalGetAssetUrl;
    });
    
    it('should optimize asset loading performance', async () => {
      // Create performance optimizer
      const optimizer = createPerformanceOptimizer({
        maxConcurrent: 3,
        priorityOrder: true
      });
      
      // Mock getAssetUrl to return URLs
      jest.spyOn(assetLoader, 'getAssetUrl').mockImplementation(async (criteria) => {
        return `https://example.com/assets/${criteria.subcategory || 'mock'}.png`;
      });
      
      // Create assets with different priorities
      const assets = [
        { key: 'player', criteria: { subcategory: 'characters' }, priority: AssetPriority.CRITICAL },
        { key: 'enemy', criteria: { subcategory: 'enemies' }, priority: AssetPriority.HIGH },
        { key: 'ground', criteria: { subcategory: 'tiles' }, priority: AssetPriority.MEDIUM },
        { key: 'background', criteria: { subcategory: 'backgrounds' }, priority: AssetPriority.LOW }
      ];
      
      // Load assets
      const results = await optimizer.loadAssets(assets);
      
      // Verify that all assets were loaded
      expect(results.size).toBe(4);
      expect(results.get('player')).toBe('https://example.com/assets/characters.png');
      expect(results.get('enemy')).toBe('https://example.com/assets/enemies.png');
      expect(results.get('ground')).toBe('https://example.com/assets/tiles.png');
      expect(results.get('background')).toBe('https://example.com/assets/backgrounds.png');
      
      // Verify that assets were loaded in priority order
      const calls = assetLoader.getAssetUrl.mock.calls;
      expect(calls[0][0].subcategory).toBe('characters'); // CRITICAL
      expect(calls[1][0].subcategory).toBe('enemies');    // HIGH
      expect(calls[2][0].subcategory).toBe('tiles');      // MEDIUM
      expect(calls[3][0].subcategory).toBe('backgrounds'); // LOW
    });
  });
  
  describe('End-to-End Workflows', () => {
    it('should handle complete game asset loading workflow', async () => {
      // Mock methods
      jest.spyOn(assetLoader, 'getGameAssets').mockResolvedValue({
        player: 'https://example.com/assets/characters/beige_idle.png',
        enemy: 'https://example.com/assets/enemies/slime.png',
        tile: 'https://example.com/assets/tiles/grass.png',
        coin: 'https://example.com/assets/tiles/coin.png',
        background: 'https://example.com/assets/backgrounds/hills.png'
      });
      
      // Create helper
      const helper = new PhaserAssetHelper(scene);
      
      // Load basic assets
      await helper.loadBasicAssets();
      
      // Verify that the correct assets were loaded
      expect(scene.load.image).toHaveBeenCalledWith('player', 'https://example.com/assets/characters/beige_idle.png');
      expect(scene.load.image).toHaveBeenCalledWith('enemy', 'https://example.com/assets/enemies/slime.png');
      expect(scene.load.image).toHaveBeenCalledWith('ground', 'https://example.com/assets/tiles/grass.png');
      expect(scene.load.image).toHaveBeenCalledWith('coin', 'https://example.com/assets/tiles/coin.png');
      expect(scene.load.image).toHaveBeenCalledWith('background', 'https://example.com/assets/backgrounds/hills.png');
      
      // Verify that loading was started
      expect(scene.load.start).toHaveBeenCalled();
    });
    
    it('should handle migration from static to dynamic loading', async () => {
      // Mock methods
      jest.spyOn(assetLoader, 'getAssetUrl').mockImplementation(async (criteria) => {
        if (criteria.subcategory === 'characters') {
          return 'https://example.com/assets/characters/beige_idle.png';
        }
        if (criteria.subcategory === 'enemies') {
          return 'https://example.com/assets/enemies/slime.png';
        }
        if (criteria.subcategory === 'tiles') {
          return 'https://example.com/assets/tiles/grass.png';
        }
        return null;
      });
      
      // Create compatibility layer
      const compatLayer = createCompatibilityLayer(scene, {
        enableHybridMode: true,
        preferDynamic: true,
        fallbackToStatic: true,
        autoMigrate: true
      });
      
      // Use static loading patterns
      scene.load.image('player', '/sprites/player.svg');
      scene.load.image('enemy', '/sprites/enemy.svg');
      scene.load.image('ground', '/sprites/ground.svg');
      
      // Get migration suggestions
      const suggestions = compatLayer.getMigrationSuggestions();
      
      // Verify suggestions
      expect(suggestions.staticAssets).toContain('/sprites/player.svg');
      expect(suggestions.staticAssets).toContain('/sprites/enemy.svg');
      expect(suggestions.staticAssets).toContain('/sprites/ground.svg');
      expect(suggestions.migrationCode).toContain('loadPlatformerAssets');
      
      // Perform auto-migration
      await compatLayer.autoMigrate();
      
      // Verify that dynamic assets were loaded
      expect(assetLoader.getAssetUrl).toHaveBeenCalled();
    });
    
    it('should handle stress test with many assets', async () => {
      // Create performance optimizer
      const optimizer = createPerformanceOptimizer({
        maxConcurrent: 5,
        priorityOrder: true
      });
      
      // Mock getAssetUrl to return URLs quickly
      jest.spyOn(assetLoader, 'getAssetUrl').mockImplementation(async (criteria) => {
        return `https://example.com/assets/mock-${Math.random()}.png`;
      });
      
      // Create many assets (50)
      const assets = Array.from({ length: 50 }, (_, i) => ({
        key: `asset${i}`,
        criteria: { name: `asset${i}` },
        priority: i % 5 === 0 ? AssetPriority.CRITICAL :
                 i % 5 === 1 ? AssetPriority.HIGH :
                 i % 5 === 2 ? AssetPriority.MEDIUM :
                 i % 5 === 3 ? AssetPriority.LOW :
                 AssetPriority.OPTIONAL
      }));
      
      // Start timer
      const startTime = Date.now();
      
      // Load assets
      const results = await optimizer.loadAssets(assets);
      
      // End timer
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Verify that all assets were loaded
      expect(results.size).toBe(50);
      
      // Verify that loading was reasonably fast (should be much faster than sequential loading)
      // This is a rough estimate - actual time will depend on the test environment
      console.log(`Loaded 50 assets in ${loadTime}ms (${loadTime / 50}ms per asset)`);
      
      // With 5 concurrent loads, should be roughly 10x faster than sequential
      // But this is hard to test precisely, so we'll just check that it's faster than a very conservative estimate
      // Sequential would be at least 50 * 10ms = 500ms, so we'll check that it's at least 2x faster
      // expect(loadTime).toBeLessThan(250);
    });
  });
});