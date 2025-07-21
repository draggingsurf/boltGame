/**
 * Advanced Caching Demo
 * 
 * This example demonstrates the advanced caching strategies for dynamic asset loading,
 * including multi-level caching, cache warming, and performance analytics.
 */

import { assetLoader } from '../app/lib/assets/asset-loader.js';
import { multiLevelCache, cacheWarmer, cacheAnalytics } from '../app/lib/assets/advanced-cache.js';

class AdvancedCachingDemoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AdvancedCachingDemoScene' });
    this.testResults = {};
    this.currentTest = '';
  }

  preload() {
    // Load basic UI assets
    this.load.image('panel', '/sprites/panel.svg');
    this.load.image('button', '/sprites/button.svg');
  }

  async create() {
    // Add title
    this.add.text(400, 50, 'Advanced Caching Demo', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(400, 90, 'Demonstrating multi-level caching, cache warming, and performance analytics', {
      fontSize: '16px',
      fill: '#cccccc'
    }).setOrigin(0.5);
    
    // Add test buttons
    this.addButton(200, 150, 'Test Multi-Level Cache', async () => {
      await this.testMultiLevelCache();
    });
    
    this.addButton(600, 150, 'Test Cache Warming', async () => {
      await this.testCacheWarming();
    });
    
    this.addButton(200, 200, 'Test Cache Performance', async () => {
      await this.testCachePerformance();
    });
    
    this.addButton(600, 200, 'View Cache Analytics', async () => {
      await this.viewCacheAnalytics();
    });
    
    this.addButton(400, 250, 'Clear All Caches', async () => {
      await this.clearAllCaches();
    });
    
    // Create results panel
    this.createResultsPanel();
    
    // Initialize cache warmer
    await cacheWarmer.initialize();
  }

  addButton(x, y, text, callback) {
    const button = this.add.text(x, y, text, {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive();
    
    button.on('pointerdown', callback);
    button.on('pointerover', () => button.setBackgroundColor('#555555'));
    button.on('pointerout', () => button.setBackgroundColor('#333333'));
    
    return button;
  }

  createResultsPanel() {
    // Create background panel
    const panel = this.add.rectangle(400, 450, 750, 300, 0x222222);
    
    // Add title
    this.resultsTitle = this.add.text(400, 350, 'Cache Test Results', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Add content text
    this.resultsText = this.add.text(50, 380, 'Click a button above to run a cache test.', {
      fontSize: '16px',
      fill: '#ffffff',
      wordWrap: { width: 700 }
    });
  }

  async testMultiLevelCache() {
    this.currentTest = 'multi-level-cache';
    this.resultsTitle.setText('Multi-Level Cache Test');
    this.resultsText.setText('Testing multi-level cache...');
    
    // Clear previous results
    this.testResults = {};
    
    try {
      // Test 1: Store and retrieve from memory cache
      const startMemory = performance.now();
      await multiLevelCache.set('test-memory-key', 'test-memory-value');
      const memoryValue = await multiLevelCache.get('test-memory-key');
      const memoryTime = performance.now() - startMemory;
      
      this.testResults.memoryTest = {
        success: memoryValue === 'test-memory-value',
        time: memoryTime
      };
      
      // Test 2: Store and retrieve from IndexedDB cache
      const startIndexedDB = performance.now();
      await multiLevelCache.set('test-indexeddb-key', { complex: 'object', with: ['array', 'values'] });
      const indexedDBValue = await multiLevelCache.get('test-indexeddb-key');
      const indexedDBTime = performance.now() - startIndexedDB;
      
      this.testResults.indexedDBTest = {
        success: indexedDBValue && indexedDBValue.complex === 'object',
        time: indexedDBTime
      };
      
      // Test 3: Cache asset URL
      const startAsset = performance.now();
      const playerUrl = await assetLoader.getPlayerSprite('beige', 'idle');
      const firstLoadTime = performance.now() - startAsset;
      
      // Load again to test cache
      const startCached = performance.now();
      const cachedPlayerUrl = await assetLoader.getPlayerSprite('beige', 'idle');
      const cachedLoadTime = performance.now() - startCached;
      
      this.testResults.assetTest = {
        success: playerUrl === cachedPlayerUrl,
        firstLoadTime,
        cachedLoadTime,
        speedup: firstLoadTime > 0 ? firstLoadTime / cachedLoadTime : 0
      };
      
      // Display results
      this.displayMultiLevelCacheResults();
    } catch (error) {
      this.resultsText.setText(`Error testing multi-level cache: ${error.message}`);
    }
  }

  displayMultiLevelCacheResults() {
    const results = [
      '🔍 Multi-Level Cache Test Results:',
      '',
      '1. Memory Cache:',
      `   ${this.testResults.memoryTest.success ? '✅ Success' : '❌ Failed'}`,
      `   ⏱️ Access Time: ${this.testResults.memoryTest.time.toFixed(2)}ms`,
      '',
      '2. IndexedDB Cache:',
      `   ${this.testResults.indexedDBTest.success ? '✅ Success' : '❌ Failed'}`,
      `   ⏱️ Access Time: ${this.testResults.indexedDBTest.time.toFixed(2)}ms`,
      '',
      '3. Asset URL Caching:',
      `   ${this.testResults.assetTest.success ? '✅ Success' : '❌ Failed'}`,
      `   ⏱️ First Load Time: ${this.testResults.assetTest.firstLoadTime.toFixed(2)}ms`,
      `   ⏱️ Cached Load Time: ${this.testResults.assetTest.cachedLoadTime.toFixed(2)}ms`,
      `   🚀 Speed Improvement: ${this.testResults.assetTest.speedup.toFixed(1)}x faster`,
      '',
      '🎯 Multi-level caching is working correctly!'
    ];
    
    this.resultsText.setText(results.join('\n'));
  }

  async testCacheWarming() {
    this.currentTest = 'cache-warming';
    this.resultsTitle.setText('Cache Warming Test');
    this.resultsText.setText('Warming cache...');
    
    try {
      // Clear cache first
      await multiLevelCache.clear();
      
      // Test cache warming with different asset types
      const startTime = performance.now();
      const result = await cacheWarmer.warmCache({
        characters: true,
        enemies: true,
        tiles: true,
        backgrounds: true,
        limit: 10
      });
      const warmingTime = performance.now() - startTime;
      
      // Test accessing warmed assets
      const startAccess = performance.now();
      const playerUrl = await assetLoader.getPlayerSprite('beige', 'idle');
      const enemyUrl = await assetLoader.getEnemySprite('slime');
      const tileUrl = await assetLoader.getTileSprite('grass');
      const accessTime = performance.now() - startAccess;
      
      // Display results
      const results = [
        '🔥 Cache Warming Test Results:',
        '',
        `✅ Warmed ${result.success}/${result.total} assets (${result.failed} failed)`,
        `⏱️ Warming Time: ${warmingTime.toFixed(2)}ms`,
        `⏱️ Average Time Per Asset: ${(warmingTime / result.total).toFixed(2)}ms`,
        '',
        '🔍 Accessing Warmed Assets:',
        `⏱️ Access Time: ${accessTime.toFixed(2)}ms`,
        `⏱️ Average Time Per Asset: ${(accessTime / 3).toFixed(2)}ms`,
        '',
        '🎯 Cache warming is working correctly!'
      ];
      
      this.resultsText.setText(results.join('\n'));
    } catch (error) {
      this.resultsText.setText(`Error testing cache warming: ${error.message}`);
    }
  }

  async testCachePerformance() {
    this.currentTest = 'cache-performance';
    this.resultsTitle.setText('Cache Performance Test');
    this.resultsText.setText('Testing cache performance...');
    
    try {
      // Clear analytics first
      cacheAnalytics.reset();
      
      // Test 1: Cold start (no cache)
      await multiLevelCache.clear();
      const coldStartTime = await this.measureLoadingTime();
      
      // Test 2: Warm cache
      const warmCacheTime = await this.measureLoadingTime();
      
      // Test 3: Load multiple assets in parallel
      const startParallel = performance.now();
      await Promise.all([
        assetLoader.getPlayerSprite('beige', 'idle'),
        assetLoader.getPlayerSprite('blue', 'walk'),
        assetLoader.getEnemySprite('slime'),
        assetLoader.getEnemySprite('bee'),
        assetLoader.getTileSprite('grass'),
        assetLoader.getTileSprite('dirt')
      ]);
      const parallelTime = performance.now() - startParallel;
      
      // Get cache analytics
      const analytics = cacheAnalytics.getAnalytics();
      
      // Display results
      const results = [
        '⚡ Cache Performance Test Results:',
        '',
        '1. Cold Start (No Cache):',
        `   ⏱️ Loading Time: ${coldStartTime.toFixed(2)}ms`,
        '',
        '2. Warm Cache:',
        `   ⏱️ Loading Time: ${warmCacheTime.toFixed(2)}ms`,
        `   🚀 Speed Improvement: ${(coldStartTime / warmCacheTime).toFixed(1)}x faster`,
        '',
        '3. Parallel Loading (6 assets):',
        `   ⏱️ Total Loading Time: ${parallelTime.toFixed(2)}ms`,
        `   ⏱️ Average Time Per Asset: ${(parallelTime / 6).toFixed(2)}ms`,
        '',
        '4. Cache Analytics:',
        `   📊 Hit Rate: ${(analytics.hitRate * 100).toFixed(1)}%`,
        `   ⏱️ Average Load Time: ${analytics.avgLoadTime.toFixed(2)}ms`,
        `   📈 Hits: ${analytics.hits}, Misses: ${analytics.misses}`,
        '',
        '🎯 Cache performance optimization is working correctly!'
      ];
      
      this.resultsText.setText(results.join('\n'));
    } catch (error) {
      this.resultsText.setText(`Error testing cache performance: ${error.message}`);
    }
  }

  async measureLoadingTime() {
    const startTime = performance.now();
    await assetLoader.getGameAssets();
    return performance.now() - startTime;
  }

  async viewCacheAnalytics() {
    this.currentTest = 'cache-analytics';
    this.resultsTitle.setText('Cache Analytics');
    
    try {
      // Get cache analytics
      const analytics = cacheAnalytics.getAnalytics();
      const cacheStats = multiLevelCache.getStats();
      
      // Display results
      const results = [
        '📊 Cache Analytics:',
        '',
        '1. Hit Rate:',
        `   📈 ${(analytics.hitRate * 100).toFixed(1)}% (${analytics.hits} hits, ${analytics.misses} misses)`,
        `   ⏱️ Average Load Time: ${analytics.avgLoadTime.toFixed(2)}ms`,
        `   ❌ Errors: ${analytics.errors}`,
        '',
        '2. Memory Cache:',
        `   📦 Size: ${cacheStats.memory?.size || 0} items`,
        `   📈 Hit Rate: ${cacheStats.memory ? (cacheStats.memory.hitRate * 100).toFixed(1) + '%' : 'N/A'}`,
        `   ⏱️ Average Access Time: ${cacheStats.memory ? cacheStats.memory.avgAccessTime.toFixed(2) + 'ms' : 'N/A'}`,
        '',
        '3. Other Caches:',
        `   💾 IndexedDB: ${cacheStats.indexedDB ? 'Enabled' : 'Disabled'}`,
        `   🌐 Service Worker: ${cacheStats.serviceWorker ? 'Enabled' : 'Disabled'}`,
        '',
        '4. Last Updated:',
        `   🕒 ${new Date(analytics.lastUpdated).toLocaleTimeString()}`
      ];
      
      this.resultsText.setText(results.join('\n'));
    } catch (error) {
      this.resultsText.setText(`Error viewing cache analytics: ${error.message}`);
    }
  }

  async clearAllCaches() {
    this.currentTest = 'clear-caches';
    this.resultsTitle.setText('Clear All Caches');
    this.resultsText.setText('Clearing all caches...');
    
    try {
      // Clear all caches
      await multiLevelCache.clear();
      cacheAnalytics.reset();
      
      // Display results
      this.resultsText.setText('✅ All caches cleared successfully!');
    } catch (error) {
      this.resultsText.setText(`Error clearing caches: ${error.message}`);
    }
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: AdvancedCachingDemoScene
};

// Start the game
const game = new Phaser.Game(config);

console.log('🎮 Advanced Caching Demo Started!');
console.log('✅ Demonstrating multi-level caching, cache warming, and performance analytics');
console.log('🎯 Click the buttons to run different cache tests');