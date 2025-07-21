/**
 * Performance Optimization Demo
 * 
 * This example demonstrates the performance optimization features for dynamic asset loading,
 * including parallel loading, lazy loading, and asset prioritization.
 */

import { assetLoader } from '../app/lib/assets/asset-loader.js';
import { 
  createPerformanceOptimizer, 
  loadParallel, 
  loadLazy, 
  createProgressiveLoader,
  AssetPriority
} from '../app/lib/assets/performance-optimizer.js';

class PerformanceOptimizationDemoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PerformanceOptimizationDemoScene' });
    this.testResults = {};
    this.currentTest = '';
    this.assets = {};
  }

  preload() {
    // Load basic UI assets
    this.load.image('panel', '/sprites/panel.svg');
    this.load.image('button', '/sprites/button.svg');
  }

  async create() {
    // Add title
    this.add.text(400, 50, 'Performance Optimization Demo', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(400, 90, 'Demonstrating parallel loading, lazy loading, and asset prioritization', {
      fontSize: '16px',
      fill: '#cccccc'
    }).setOrigin(0.5);
    
    // Prepare asset lists
    await this.prepareAssetLists();
    
    // Add test buttons
    this.addButton(200, 150, 'Test Parallel Loading', async () => {
      await this.testParallelLoading();
    });
    
    this.addButton(600, 150, 'Test Lazy Loading', async () => {
      await this.testLazyLoading();
    });
    
    this.addButton(200, 200, 'Test Asset Prioritization', async () => {
      await this.testAssetPrioritization();
    });
    
    this.addButton(600, 200, 'Test Progressive Loading', async () => {
      await this.testProgressiveLoading();
    });
    
    this.addButton(400, 250, 'Compare Loading Strategies', async () => {
      await this.compareLoadingStrategies();
    });
    
    // Create results panel
    this.createResultsPanel();
  }

  async prepareAssetLists() {
    // Character assets
    this.assets.characters = [
      { key: 'beige-idle', criteria: { subcategory: 'characters', tags: ['beige', 'idle'] }, priority: AssetPriority.CRITICAL },
      { key: 'beige-walk', criteria: { subcategory: 'characters', tags: ['beige', 'walk'] }, priority: AssetPriority.HIGH },
      { key: 'beige-jump', criteria: { subcategory: 'characters', tags: ['beige', 'jump'] }, priority: AssetPriority.HIGH },
      { key: 'blue-idle', criteria: { subcategory: 'characters', tags: ['blue', 'idle'] }, priority: AssetPriority.MEDIUM },
      { key: 'blue-walk', criteria: { subcategory: 'characters', tags: ['blue', 'walk'] }, priority: AssetPriority.LOW },
      { key: 'green-idle', criteria: { subcategory: 'characters', tags: ['green', 'idle'] }, priority: AssetPriority.MEDIUM },
      { key: 'pink-idle', criteria: { subcategory: 'characters', tags: ['pink', 'idle'] }, priority: AssetPriority.LOW },
      { key: 'yellow-idle', criteria: { subcategory: 'characters', tags: ['yellow', 'idle'] }, priority: AssetPriority.OPTIONAL }
    ];
    
    // Enemy assets
    this.assets.enemies = [
      { key: 'slime', criteria: { subcategory: 'enemies', tags: ['slime'] }, priority: AssetPriority.CRITICAL },
      { key: 'bee', criteria: { subcategory: 'enemies', tags: ['bee'] }, priority: AssetPriority.HIGH },
      { key: 'frog', criteria: { subcategory: 'enemies', tags: ['frog'] }, priority: AssetPriority.MEDIUM },
      { key: 'mouse', criteria: { subcategory: 'enemies', tags: ['mouse'] }, priority: AssetPriority.LOW },
      { key: 'fish', criteria: { subcategory: 'enemies', tags: ['fish'] }, priority: AssetPriority.OPTIONAL }
    ];
    
    // Tile assets
    this.assets.tiles = [
      { key: 'grass', criteria: { subcategory: 'tiles', tags: ['grass'] }, priority: AssetPriority.CRITICAL },
      { key: 'dirt', criteria: { subcategory: 'tiles', tags: ['dirt'] }, priority: AssetPriority.HIGH },
      { key: 'sand', criteria: { subcategory: 'tiles', tags: ['sand'] }, priority: AssetPriority.MEDIUM },
      { key: 'stone', criteria: { subcategory: 'tiles', tags: ['stone'] }, priority: AssetPriority.LOW }
    ];
    
    // Background assets
    this.assets.backgrounds = [
      { key: 'hills', criteria: { subcategory: 'backgrounds', name: 'hills' }, priority: AssetPriority.MEDIUM },
      { key: 'desert', criteria: { subcategory: 'backgrounds', name: 'desert' }, priority: AssetPriority.LOW },
      { key: 'trees', criteria: { subcategory: 'backgrounds', name: 'trees' }, priority: AssetPriority.OPTIONAL }
    ];
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
    this.resultsTitle = this.add.text(400, 350, 'Performance Test Results', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Add content text
    this.resultsText = this.add.text(50, 380, 'Click a button above to run a performance test.', {
      fontSize: '16px',
      fill: '#ffffff',
      wordWrap: { width: 700 }
    });
  }

  async testParallelLoading() {
    this.currentTest = 'parallel-loading';
    this.resultsTitle.setText('Parallel Loading Test');
    this.resultsText.setText('Testing parallel loading...');
    
    try {
      // Combine all assets
      const allAssets = [
        ...this.assets.characters,
        ...this.assets.enemies,
        ...this.assets.tiles,
        ...this.assets.backgrounds
      ];
      
      // Test 1: Sequential loading
      const sequentialStartTime = performance.now();
      const sequentialResults = new Map();
      
      for (const asset of allAssets) {
        const url = await assetLoader.getAssetUrl(asset.criteria);
        if (url) {
          sequentialResults.set(asset.key, url);
        }
      }
      
      const sequentialTime = performance.now() - sequentialStartTime;
      
      // Test 2: Parallel loading with different concurrency levels
      const concurrencyLevels = [2, 4, 6, 8];
      const parallelResults = {};
      
      for (const concurrency of concurrencyLevels) {
        const startTime = performance.now();
        
        const results = await loadParallel(allAssets, {
          maxConcurrent: concurrency,
          retryFailed: false
        });
        
        parallelResults[concurrency] = {
          time: performance.now() - startTime,
          count: results.size
        };
      }
      
      // Display results
      const results = [
        '🚀 Parallel Loading Test Results:',
        '',
        `1. Sequential Loading (${allAssets.length} assets):`,
        `   ⏱️ Total Time: ${sequentialTime.toFixed(2)}ms`,
        `   ⏱️ Average Time Per Asset: ${(sequentialTime / allAssets.length).toFixed(2)}ms`,
        '',
        '2. Parallel Loading:'
      ];
      
      for (const concurrency of concurrencyLevels) {
        const result = parallelResults[concurrency];
        const speedup = sequentialTime / result.time;
        
        results.push(
          `   🔄 Concurrency Level ${concurrency}:`,
          `      ⏱️ Total Time: ${result.time.toFixed(2)}ms`,
          `      ⏱️ Average Time Per Asset: ${(result.time / result.count).toFixed(2)}ms`,
          `      🚀 Speedup: ${speedup.toFixed(1)}x faster than sequential`
        );
      }
      
      results.push(
        '',
        '🎯 Optimal concurrency level depends on network conditions and server capacity.',
        '💡 Too many concurrent requests can overwhelm the server or network.'
      );
      
      this.resultsText.setText(results.join('\n'));
    } catch (error) {
      this.resultsText.setText(`Error testing parallel loading: ${error.message}`);
    }
  }

  async testLazyLoading() {
    this.currentTest = 'lazy-loading';
    this.resultsTitle.setText('Lazy Loading Test');
    this.resultsText.setText('Testing lazy loading...');
    
    try {
      // Categorize assets by priority
      const criticalAssets = [
        ...this.assets.characters.filter(a => a.priority === AssetPriority.CRITICAL),
        ...this.assets.enemies.filter(a => a.priority === AssetPriority.CRITICAL),
        ...this.assets.tiles.filter(a => a.priority === AssetPriority.CRITICAL)
      ];
      
      const nonCriticalAssets = [
        ...this.assets.characters.filter(a => a.priority !== AssetPriority.CRITICAL),
        ...this.assets.enemies.filter(a => a.priority !== AssetPriority.CRITICAL),
        ...this.assets.tiles.filter(a => a.priority !== AssetPriority.CRITICAL),
        ...this.assets.backgrounds
      ];
      
      // Test 1: Load critical assets first
      const criticalStartTime = performance.now();
      const criticalResults = await loadParallel(criticalAssets, {
        maxConcurrent: 4
      });
      const criticalTime = performance.now() - criticalStartTime;
      
      // Test 2: Lazy load non-critical assets
      const lazyStartTime = performance.now();
      
      // Start lazy loading
      const lazyPromise = loadLazy(nonCriticalAssets);
      
      // Simulate game starting with just critical assets
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Wait for lazy loading to complete
      const lazyResults = await lazyPromise;
      const lazyTime = performance.now() - lazyStartTime;
      
      // Display results
      const results = [
        '🛌 Lazy Loading Test Results:',
        '',
        `1. Critical Assets (${criticalAssets.length} assets):`,
        `   ⏱️ Loading Time: ${criticalTime.toFixed(2)}ms`,
        `   ⏱️ Average Time Per Asset: ${(criticalTime / criticalAssets.length).toFixed(2)}ms`,
        `   ✅ Loaded ${criticalResults.size}/${criticalAssets.length} assets`,
        '',
        `2. Non-Critical Assets (${nonCriticalAssets.length} assets):`,
        `   ⏱️ Loading Time: ${lazyTime.toFixed(2)}ms`,
        `   ⏱️ Average Time Per Asset: ${(lazyTime / nonCriticalAssets.length).toFixed(2)}ms`,
        `   ✅ Loaded ${lazyResults.size}/${nonCriticalAssets.length} assets`,
        '',
        '3. User Experience:',
        `   ⏱️ Time to Interactive: ${criticalTime.toFixed(2)}ms`,
        `   ⏱️ Total Loading Time: ${(criticalTime + lazyTime).toFixed(2)}ms`,
        `   🚀 Perceived Performance Improvement: ${((criticalTime + lazyTime) / criticalTime).toFixed(1)}x`,
        '',
        '🎯 Lazy loading improves perceived performance by loading critical assets first.',
        '💡 Users can start interacting with the game while non-critical assets load in the background.'
      ];
      
      this.resultsText.setText(results.join('\n'));
    } catch (error) {
      this.resultsText.setText(`Error testing lazy loading: ${error.message}`);
    }
  }

  async testAssetPrioritization() {
    this.currentTest = 'asset-prioritization';
    this.resultsTitle.setText('Asset Prioritization Test');
    this.resultsText.setText('Testing asset prioritization...');
    
    try {
      // Combine all assets
      const allAssets = [
        ...this.assets.characters,
        ...this.assets.enemies,
        ...this.assets.tiles,
        ...this.assets.backgrounds
      ];
      
      // Shuffle assets to simulate random order
      const shuffledAssets = [...allAssets].sort(() => Math.random() - 0.5);
      
      // Test 1: Loading without prioritization
      const unprioritizedStartTime = performance.now();
      const unprioritizedResults = await loadParallel(shuffledAssets, {
        maxConcurrent: 4,
        priorityOrder: false
      });
      const unprioritizedTime = performance.now() - unprioritizedStartTime;
      
      // Test 2: Loading with prioritization
      const prioritizedStartTime = performance.now();
      const prioritizedResults = await loadParallel(shuffledAssets, {
        maxConcurrent: 4,
        priorityOrder: true
      });
      const prioritizedTime = performance.now() - prioritizedStartTime;
      
      // Count assets by priority
      const priorityCounts = {
        [AssetPriority.CRITICAL]: allAssets.filter(a => a.priority === AssetPriority.CRITICAL).length,
        [AssetPriority.HIGH]: allAssets.filter(a => a.priority === AssetPriority.HIGH).length,
        [AssetPriority.MEDIUM]: allAssets.filter(a => a.priority === AssetPriority.MEDIUM).length,
        [AssetPriority.LOW]: allAssets.filter(a => a.priority === AssetPriority.LOW).length,
        [AssetPriority.OPTIONAL]: allAssets.filter(a => a.priority === AssetPriority.OPTIONAL).length
      };
      
      // Display results
      const results = [
        '🔢 Asset Prioritization Test Results:',
        '',
        '1. Asset Priority Distribution:',
        `   🔴 Critical: ${priorityCounts[AssetPriority.CRITICAL]} assets`,
        `   🟠 High: ${priorityCounts[AssetPriority.HIGH]} assets`,
        `   🟡 Medium: ${priorityCounts[AssetPriority.MEDIUM]} assets`,
        `   🟢 Low: ${priorityCounts[AssetPriority.LOW]} assets`,
        `   🔵 Optional: ${priorityCounts[AssetPriority.OPTIONAL]} assets`,
        '',
        '2. Loading Without Prioritization:',
        `   ⏱️ Total Time: ${unprioritizedTime.toFixed(2)}ms`,
        `   ✅ Loaded ${unprioritizedResults.size}/${allAssets.length} assets`,
        '',
        '3. Loading With Prioritization:',
        `   ⏱️ Total Time: ${prioritizedTime.toFixed(2)}ms`,
        `   ✅ Loaded ${prioritizedResults.size}/${allAssets.length} assets`,
        '',
        '4. Performance Comparison:',
        `   ⏱️ Time Difference: ${Math.abs(prioritizedTime - unprioritizedTime).toFixed(2)}ms`,
        `   ${prioritizedTime < unprioritizedTime ? '🚀 Prioritized loading was faster' : '⚠️ Unprioritized loading was faster'}`,
        '',
        '🎯 Asset prioritization ensures critical assets are loaded first.',
        '💡 This improves perceived performance even if total loading time is similar.'
      ];
      
      this.resultsText.setText(results.join('\n'));
    } catch (error) {
      this.resultsText.setText(`Error testing asset prioritization: ${error.message}`);
    }
  }

  async testProgressiveLoading() {
    this.currentTest = 'progressive-loading';
    this.resultsTitle.setText('Progressive Loading Test');
    this.resultsText.setText('Starting progressive loading...');
    
    try {
      // Combine all assets
      const allAssets = [
        ...this.assets.characters,
        ...this.assets.enemies,
        ...this.assets.tiles,
        ...this.assets.backgrounds
      ];
      
      // Create progressive loader
      const progressiveLoader = createProgressiveLoader(this, allAssets);
      
      // Start loading
      const startTime = performance.now();
      const results = await progressiveLoader.start();
      const loadingTime = performance.now() - startTime;
      
      // Display results
      const resultText = [
        '📊 Progressive Loading Test Results:',
        '',
        `✅ Loaded ${results.size}/${allAssets.length} assets`,
        `⏱️ Total Loading Time: ${loadingTime.toFixed(2)}ms`,
        `⏱️ Average Time Per Asset: ${(loadingTime / results.size).toFixed(2)}ms`,
        '',
        '🎯 Progressive loading provides visual feedback during the loading process.',
        '💡 This improves user experience by showing loading progress.'
      ];
      
      this.resultsText.setText(resultText.join('\n'));
    } catch (error) {
      this.resultsText.setText(`Error testing progressive loading: ${error.message}`);
    }
  }

  async compareLoadingStrategies() {
    this.currentTest = 'compare-strategies';
    this.resultsTitle.setText('Loading Strategies Comparison');
    this.resultsText.setText('Comparing different loading strategies...');
    
    try {
      // Combine all assets
      const allAssets = [
        ...this.assets.characters,
        ...this.assets.enemies,
        ...this.assets.tiles,
        ...this.assets.backgrounds
      ];
      
      // Test 1: Sequential loading
      const sequentialStartTime = performance.now();
      const sequentialResults = new Map();
      
      for (const asset of allAssets) {
        const url = await assetLoader.getAssetUrl(asset.criteria);
        if (url) {
          sequentialResults.set(asset.key, url);
        }
      }
      
      const sequentialTime = performance.now() - sequentialStartTime;
      
      // Test 2: Parallel loading
      const parallelStartTime = performance.now();
      const parallelResults = await loadParallel(allAssets, {
        maxConcurrent: 4,
        priorityOrder: false
      });
      const parallelTime = performance.now() - parallelStartTime;
      
      // Test 3: Prioritized loading
      const prioritizedStartTime = performance.now();
      const prioritizedResults = await loadParallel(allAssets, {
        maxConcurrent: 4,
        priorityOrder: true
      });
      const prioritizedTime = performance.now() - prioritizedStartTime;
      
      // Test 4: Lazy loading
      const criticalAssets = allAssets.filter(a => 
        a.priority === AssetPriority.CRITICAL || a.priority === AssetPriority.HIGH
      );
      const nonCriticalAssets = allAssets.filter(a => 
        a.priority !== AssetPriority.CRITICAL && a.priority !== AssetPriority.HIGH
      );
      
      const lazyStartTime = performance.now();
      const criticalResults = await loadParallel(criticalAssets, {
        maxConcurrent: 4
      });
      const criticalTime = performance.now() - lazyStartTime;
      
      const lazyResults = await loadLazy(nonCriticalAssets);
      const lazyTotalTime = performance.now() - lazyStartTime;
      
      // Display results
      const results = [
        '📊 Loading Strategies Comparison:',
        '',
        `1. Sequential Loading (${sequentialResults.size}/${allAssets.length} assets):`,
        `   ⏱️ Total Time: ${sequentialTime.toFixed(2)}ms`,
        '',
        `2. Parallel Loading (${parallelResults.size}/${allAssets.length} assets):`,
        `   ⏱️ Total Time: ${parallelTime.toFixed(2)}ms`,
        `   🚀 Speedup vs. Sequential: ${(sequentialTime / parallelTime).toFixed(1)}x`,
        '',
        `3. Prioritized Loading (${prioritizedResults.size}/${allAssets.length} assets):`,
        `   ⏱️ Total Time: ${prioritizedTime.toFixed(2)}ms`,
        `   🚀 Speedup vs. Sequential: ${(sequentialTime / prioritizedTime).toFixed(1)}x`,
        '',
        `4. Lazy Loading:`,
        `   ⏱️ Time to Interactive: ${criticalTime.toFixed(2)}ms`,
        `   ⏱️ Total Time: ${lazyTotalTime.toFixed(2)}ms`,
        `   🚀 Perceived Performance Improvement: ${(sequentialTime / criticalTime).toFixed(1)}x`,
        '',
        '🏆 Recommended Strategy:',
        '   Combine prioritized loading for critical assets with lazy loading for non-critical assets.',
        '   This provides the best balance of total loading time and perceived performance.'
      ];
      
      this.resultsText.setText(results.join('\n'));
    } catch (error) {
      this.resultsText.setText(`Error comparing loading strategies: ${error.message}`);
    }
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: PerformanceOptimizationDemoScene
};

// Start the game
const game = new Phaser.Game(config);

console.log('🎮 Performance Optimization Demo Started!');
console.log('✅ Demonstrating parallel loading, lazy loading, and asset prioritization');
console.log('🎯 Click the buttons to run different performance tests');