/**
 * Backward Compatibility Demo
 * 
 * This example demonstrates how to use the backward compatibility features
 * to smoothly transition from static to dynamic asset loading.
 */

import { createCompatibilityLayer } from '../app/lib/assets/compatibility-layer.js';
import { createHybridLoader } from '../app/lib/assets/hybrid-loader.js';
import { rollbackManager } from '../app/lib/assets/rollback-manager.js';

class CompatibilityDemoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CompatibilityDemoScene' });
    this.assetMode = 'hybrid'; // 'static', 'dynamic', or 'hybrid'
  }

  preload() {
    // Show loading text
    this.loadingText = this.add.text(400, 300, 'Loading assets...', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Setup based on selected mode
    switch (this.assetMode) {
      case 'static':
        this.loadStaticAssets();
        break;
      case 'dynamic':
        this.loadDynamicAssets();
        break;
      case 'hybrid':
        this.loadHybridAssets();
        break;
    }
  }

  /**
   * Traditional static asset loading
   */
  loadStaticAssets() {
    // This is the old way of loading assets
    this.load.image('player', '/sprites/player.svg');
    this.load.image('enemy', '/sprites/enemy.svg');
    this.load.image('ground', '/sprites/ground.svg');
    this.load.image('coin', '/sprites/coin.svg');
    this.load.image('background', '/backgrounds/sky.svg');
    
    // Apply compatibility layer to intercept and monitor static loading
    this.compatLayer = createCompatibilityLayer(this, {
      enableHybridMode: true,
      preferDynamic: true,
      logMigrationSuggestions: true
    });
  }

  /**
   * Pure dynamic asset loading
   */
  async loadDynamicAssets() {
    // Import dynamic helpers
    const { loadPlatformerAssets } = await import('../app/lib/assets/phaser-helpers.js');
    
    // Load assets dynamically
    await loadPlatformerAssets(this);
  }

  /**
   * Hybrid asset loading (can switch between static and dynamic)
   */
  async loadHybridAssets() {
    // Create hybrid loader
    this.hybridLoader = createHybridLoader(this, {
      preferDynamic: true,
      staticBasePath: '',
      enableFallback: true,
      logLoadingDetails: true
    });
    
    // Define assets with both dynamic criteria and static fallback
    const assets = [
      {
        key: 'player',
        dynamicCriteria: { subcategory: 'characters', tags: ['beige', 'idle'] },
        staticPath: '/sprites/player.svg',
        type: 'image'
      },
      {
        key: 'enemy',
        dynamicCriteria: { subcategory: 'enemies', tags: ['slime'] },
        staticPath: '/sprites/enemy.svg',
        type: 'image'
      },
      {
        key: 'ground',
        dynamicCriteria: { subcategory: 'tiles', tags: ['grass'] },
        staticPath: '/sprites/ground.svg',
        type: 'image'
      },
      {
        key: 'coin',
        dynamicCriteria: { name: 'coin' },
        staticPath: '/sprites/coin.svg',
        type: 'image'
      },
      {
        key: 'background',
        dynamicCriteria: { subcategory: 'backgrounds', name: 'hills' },
        staticPath: '/backgrounds/sky.svg',
        type: 'image'
      }
    ];
    
    // Load all assets
    const loadedCount = await this.hybridLoader.loadAssets(assets);
    console.log(`✅ Loaded ${loadedCount}/${assets.length} assets`);
  }

  create() {
    // Remove loading text
    if (this.loadingText) {
      this.loadingText.destroy();
    }
    
    // Add title
    this.add.text(400, 50, 'Backward Compatibility Demo', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(400, 90, `Mode: ${this.assetMode.toUpperCase()}`, {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Create game objects
    this.createGameObjects();
    
    // Add controls
    this.setupControls();
    
    // Show stats
    this.showStats();
  }

  createGameObjects() {
    // Background
    if (this.textures.exists('background')) {
      this.add.image(400, 300, 'background').setScale(1);
    }
    
    // Ground
    if (this.textures.exists('ground')) {
      for (let x = 0; x < 800; x += 64) {
        this.add.image(x + 32, 500, 'ground');
      }
    }
    
    // Player
    if (this.textures.exists('player')) {
      this.player = this.add.sprite(200, 400, 'player').setScale(2);
    }
    
    // Enemy
    if (this.textures.exists('enemy')) {
      this.enemy = this.add.sprite(600, 400, 'enemy').setScale(2);
    }
    
    // Coins
    if (this.textures.exists('coin')) {
      for (let i = 0; i < 5; i++) {
        this.add.sprite(150 + i * 100, 350, 'coin');
      }
    }
  }

  setupControls() {
    // Add mode toggle buttons
    this.addButton(200, 150, 'Static Mode', () => this.changeMode('static'));
    this.addButton(400, 150, 'Dynamic Mode', () => this.changeMode('dynamic'));
    this.addButton(600, 150, 'Hybrid Mode', () => this.changeMode('hybrid'));
    
    // Add rollback controls
    this.addButton(200, 200, 'Enable Dynamic', () => {
      rollbackManager.rollbackToDynamic(true);
      this.showStats();
    });
    
    this.addButton(400, 200, 'Disable Dynamic', () => {
      rollbackManager.rollbackToDynamic(false);
      this.showStats();
    });
    
    this.addButton(600, 200, 'Reset Stats', () => {
      rollbackManager.reset();
      this.showStats();
    });
  }

  addButton(x, y, text, callback) {
    const button = this.add.text(x, y, text, {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive();
    
    button.on('pointerdown', callback);
    button.on('pointerover', () => button.setBackgroundColor('#555555'));
    button.on('pointerout', () => button.setBackgroundColor('#333333'));
    
    return button;
  }

  showStats() {
    // Remove existing stats
    if (this.statsText) {
      this.statsText.destroy();
    }
    
    // Get stats based on mode
    let stats = {};
    
    if (this.assetMode === 'static' && this.compatLayer) {
      stats = this.compatLayer.getStats();
    } else if (this.assetMode === 'hybrid' && this.hybridLoader) {
      stats = this.hybridLoader.getStats();
    }
    
    // Get rollback stats
    const rollbackStats = rollbackManager.getStats();
    
    // Create stats text
    const statsString = [
      `Asset Mode: ${this.assetMode}`,
      `Dynamic Loading: ${rollbackStats.dynamicLoadingEnabled ? 'Enabled' : 'Disabled'}`,
      `Error Count: ${rollbackStats.errorCount}`,
      `Last Rollback: ${rollbackStats.lastRollbackTime || 'Never'}`,
      `Dynamic Loading Time: ${rollbackStats.avgDynamicLoadingTime ? rollbackStats.avgDynamicLoadingTime.toFixed(0) + 'ms' : 'N/A'}`,
      `Static Loading Time: ${rollbackStats.avgStaticLoadingTime ? rollbackStats.avgStaticLoadingTime.toFixed(0) + 'ms' : 'N/A'}`
    ].join('\n');
    
    this.statsText = this.add.text(400, 450, statsString, {
      fontSize: '16px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    }).setOrigin(0.5);
  }

  changeMode(mode) {
    this.assetMode = mode;
    this.scene.restart();
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: CompatibilityDemoScene
};

// Start the game
const game = new Phaser.Game(config);

console.log('🎮 Backward Compatibility Demo Started!');
console.log('✅ Demonstrates smooth transition between static and dynamic asset loading');
console.log('🎯 Try different modes and observe the behavior');