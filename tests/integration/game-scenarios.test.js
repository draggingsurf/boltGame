/**
 * Integration tests for game scenarios using the dynamic asset loading system
 */

const { AssetLoader } = require('../../app/lib/assets/asset-loader');
const { assetErrorHandler } = require('../../app/lib/assets/error-handler');
const { PerformanceOptimizer } = require('../../app/lib/assets/performance-optimizer');
const { AdvancedCache } = require('../../app/lib/assets/advanced-cache');

// Mock Phaser for testing
const mockPhaser = {
  Scene: class MockScene {
    constructor() {
      this.load = {
        image: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
        start: jest.fn()
      };
      this.add = {
        sprite: jest.fn(() => ({
          setScale: jest.fn().mockReturnThis(),
          play: jest.fn()
        })),
        graphics: jest.fn(() => ({
          fillStyle: jest.fn().mockReturnThis(),
          fillRect: jest.fn().mockReturnThis(),
          clear: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        })),
        text: jest.fn(() => ({
          setOrigin: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        })),
        image: jest.fn(() => ({
          setOrigin: jest.fn().mockReturnThis()
        }))
      };
      this.anims = {
        create: jest.fn(),
        exists: jest.fn().mockReturnValue(true)
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

// Mock fetch for testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      version: "1.0.0",
      generated_at: new Date().toISOString(),
      base_url: "https://example.com/assets/",
      assets: [
        {
          id: "test-player",
          name: "Character Beige Idle",
          url: "https://example.com/assets/platformer/sprites/characters/character_beige_idle.png",
          category: "sprites",
          subcategory: "characters",
          tags: ["beige", "idle", "characters"],
          file_type: "png"
        },
        {
          id: "test-enemy",
          name: "Slime Block Rest",
          url: "https://example.com/assets/platformer/sprites/enemies/slime_block_rest.png",
          category: "sprites",
          subcategory: "enemies",
          tags: ["slime", "enemies"],
          file_type: "png"
        },
        {
          id: "test-tile",
          name: "Grass",
          url: "https://example.com/assets/platformer/sprites/tiles/grass.png",
          category: "sprites",
          subcategory: "tiles",
          tags: ["grass", "tiles"],
          file_type: "png"
        }
      ],
      search_index: {}
    })
  })
);

// Mock performance.now for testing
global.performance = {
  now: jest.fn(() => Date.now())
};

describe('Game Scenarios Integration Tests', () => {
  let assetLoader;
  let performanceOptimizer;
  let advancedCache;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create instances
    assetLoader = new AssetLoader(assetErrorHandler);
    performanceOptimizer = new PerformanceOptimizer();
    advancedCache = new AdvancedCache();
  });

  describe('Platformer Game Scenario', () => {
    test('should load all required assets for a platformer game', async () => {
      // Create a mock Phaser scene
      const scene = new mockPhaser.Scene();

      // Load the manifest
      await assetLoader.loadManifest();

      // Get game assets
      const gameAssets = await assetLoader.getGameAssets();

      // Verify assets were retrieved
      expect(gameAssets.player).toBeTruthy();
      expect(gameAssets.enemy).toBeTruthy();
      expect(gameAssets.tile).toBeTruthy();

      // Load assets into Phaser
      scene.load.image('player', gameAssets.player);
      scene.load.image('enemy', gameAssets.enemy);
      scene.load.image('ground', gameAssets.tile);

      // Simulate Phaser's load complete event
      const loadCompleteCallback = scene.load.on.mock.calls.find(
        call => call[0] === 'complete'
      )?.[1];

      if (loadCompleteCallback) {
        loadCompleteCallback();
      }

      // Verify Phaser loaded the assets
      expect(scene.load.image).toHaveBeenCalledWith('player', expect.any(String));
      expect(scene.load.image).toHaveBeenCalledWith('enemy', expect.any(String));
      expect(scene.load.image).toHaveBeenCalledWith('ground', expect.any(String));
    });

    test('should handle asset loading errors gracefully', async () => {
      // Create a mock Phaser scene
      const scene = new mockPhaser.Scene();

      // Mock a failed fetch
      global.fetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      // Create error handler spy
      const errorHandlerSpy = jest.spyOn(assetErrorHandler, 'handleError');

      // Load the manifest (should use fallback)
      await assetLoader.loadManifest();

      // Get game assets
      const gameAssets = await assetLoader.getGameAssets();

      // Verify fallback assets were used
      expect(gameAssets.player).toBeTruthy();
      expect(gameAssets.enemy).toBeTruthy();
      expect(gameAssets.tile).toBeTruthy();

      // Verify error was handled
      expect(errorHandlerSpy).toHaveBeenCalled();
    });
  });

  describe('Character Animation Scenario', () => {
    test('should load character animations for different colors', async () => {
      // Create a mock Phaser scene
      const scene = new mockPhaser.Scene();

      // Load the manifest
      await assetLoader.loadManifest();

      // Get character assets for different colors
      const beigeIdle = await assetLoader.getPlayerSprite('beige', 'idle');
      const blueIdle = await assetLoader.getPlayerSprite('blue', 'idle');

      // Verify assets were retrieved
      expect(beigeIdle).toBeTruthy();
      expect(blueIdle).toBeTruthy();

      // Load assets into Phaser
      scene.load.image('beige-idle', beigeIdle);
      scene.load.image('blue-idle', blueIdle);

      // Create animations
      scene.anims.create({
        key: 'beige-idle-anim',
        frames: [{ key: 'beige-idle' }],
        frameRate: 10,
        repeat: -1
      });

      scene.anims.create({
        key: 'blue-idle-anim',
        frames: [{ key: 'blue-idle' }],
        frameRate: 10,
        repeat: -1
      });

      // Create sprites
      const beigePlayer = scene.add.sprite(100, 100, 'beige-idle');
      const bluePlayer = scene.add.sprite(200, 100, 'blue-idle');

      // Play animations
      beigePlayer.play('beige-idle-anim');
      bluePlayer.play('blue-idle-anim');

      // Verify animations were played
      expect(beigePlayer.play).toHaveBeenCalledWith('beige-idle-anim');
      expect(bluePlayer.play).toHaveBeenCalledWith('blue-idle-anim');
    });
  });

  describe('Performance Optimization Scenario', () => {
    test('should optimize asset loading based on device capabilities', async () => {
      // Mock device detection
      performanceOptimizer.detectDeviceCapabilities = jest.fn(() => ({
        isMobile: false,
        hasHighEndGPU: true,
        connectionType: 'wifi',
        availableMemory: 8000,
        screenWidth: 1920,
        screenHeight: 1080
      }));

      // Get optimization settings
      const settings = performanceOptimizer.getOptimizationSettings();

      // Load the manifest
      await assetLoader.loadManifest();

      // Get optimized assets based on device capabilities
      const optimizedAssets = await performanceOptimizer.getOptimizedAssets(
        assetLoader,
        settings
      );

      // Verify optimized assets were retrieved
      expect(optimizedAssets.useHighRes).toBe(true);
      expect(optimizedAssets.preloadStrategy).toBe('aggressive');
      expect(optimizedAssets.assets).toBeTruthy();
    });

    test('should adapt to low-end devices', async () => {
      // Mock device detection for low-end device
      performanceOptimizer.detectDeviceCapabilities = jest.fn(() => ({
        isMobile: true,
        hasHighEndGPU: false,
        connectionType: '3g',
        availableMemory: 2000,
        screenWidth: 360,
        screenHeight: 640
      }));

      // Get optimization settings
      const settings = performanceOptimizer.getOptimizationSettings();

      // Load the manifest
      await assetLoader.loadManifest();

      // Get optimized assets based on device capabilities
      const optimizedAssets = await performanceOptimizer.getOptimizedAssets(
        assetLoader,
        settings
      );

      // Verify optimized assets were retrieved
      expect(optimizedAssets.useHighRes).toBe(false);
      expect(optimizedAssets.preloadStrategy).toBe('minimal');
      expect(optimizedAssets.assets).toBeTruthy();
    });
  });

  describe('Advanced Caching Scenario', () => {
    test('should cache assets for faster loading', async () => {
      // Setup cache
      advancedCache.initialize();

      // Load the manifest
      await assetLoader.loadManifest();

      // First request (not cached)
      const startTime1 = performance.now();
      const asset1 = await assetLoader.getPlayerSprite('beige', 'idle');
      const endTime1 = performance.now();
      const time1 = endTime1 - startTime1;

      // Store in cache
      await advancedCache.set('beige-idle', asset1);

      // Second request (should be cached)
      const startTime2 = performance.now();
      const asset2 = await advancedCache.get('beige-idle');
      const endTime2 = performance.now();
      const time2 = endTime2 - startTime2;

      // Verify cache is working
      expect(asset1).toBe(asset2);
      expect(time2).toBeLessThanOrEqual(time1);
    });

    test('should handle cache misses gracefully', async () => {
      // Setup cache
      advancedCache.initialize();

      // Load the manifest
      await assetLoader.loadManifest();

      // Try to get non-existent asset from cache
      const cachedAsset = await advancedCache.get('non-existent-asset');

      // Verify cache miss
      expect(cachedAsset).toBeNull();

      // Get asset from loader
      const asset = await assetLoader.getPlayerSprite('beige', 'idle');

      // Verify asset was retrieved
      expect(asset).toBeTruthy();
    });
  });

  describe('Error Handling Scenario', () => {
    test('should handle network errors gracefully', async () => {
      // Mock a failed fetch
      global.fetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      // Create error handler spy
      const errorHandlerSpy = jest.spyOn(assetErrorHandler, 'handleError');

      // Load the manifest (should use fallback)
      await assetLoader.loadManifest();

      // Verify error was handled
      expect(errorHandlerSpy).toHaveBeenCalled();

      // Get asset (should use fallback)
      const asset = await assetLoader.getPlayerSprite('beige', 'idle');

      // Verify fallback asset was used
      expect(asset).toBeTruthy();
    });

    test('should handle invalid assets gracefully', async () => {
      // Create error handler spy
      const errorHandlerSpy = jest.spyOn(assetErrorHandler, 'handleError');

      // Load the manifest
      await assetLoader.loadManifest();

      // Try to get non-existent asset
      const asset = await assetLoader.getPlayerSprite('non-existent', 'non-existent');

      // Verify fallback was used
      expect(asset).toBeNull();
    });
  });
});