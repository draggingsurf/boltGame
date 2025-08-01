/**
 * Game Asset Helper - Standardized Dimensions & Positioning System
 * 
 * This helper eliminates awkward asset sizing by providing:
 * - Automatic scale calculation from asset registry
 * - Intelligent positioning on 32px grid
 * - Consistent collision box setup
 * - Smart layout system for all game elements
 */

class GameAssetHelper {
  constructor(scene) {
    this.scene = scene;
    this.assetRegistry = null;
    this.gameWidth = 800;
    this.gameHeight = 600;
    this.gridSize = 32;
    
    // Standard game layout positions
    this.layout = {
      groundLevel: this.gameHeight - 96,   // y = 504
      platform1: this.gameHeight - 160,   // y = 440  
      platform2: this.gameHeight - 224,   // y = 376
      platform3: this.gameHeight - 288,   // y = 312
      platform4: this.gameHeight - 352,   // y = 248
    };
  }

  /**
   * Load the asset registry with dimension information
   */
  async loadAssetRegistry() {
    try {
      const response = await fetch('/assets/platformer-assets.json');
      this.assetRegistry = await response.json();
      return this.assetRegistry;
    } catch (error) {
      console.error('Failed to load asset registry:', error);
      return null;
    }
  }

  /**
   * Get asset information by ID
   */
  getAssetInfo(assetId) {
    if (!this.assetRegistry) {
      console.error('Asset registry not loaded. Call loadAssetRegistry() first.');
      return null;
    }

    // Search through all categories
    for (const category of Object.values(this.assetRegistry.categories)) {
      const asset = category.assets.find(a => a.id === assetId);
      if (asset) {
        return asset;
      }
    }

    console.error(`Asset not found: ${assetId}`);
    return null;
  }

  /**
   * Create a sprite with automatic scaling and positioning
   */
  createSprite(x, y, assetId, spriteKey) {
    const assetInfo = this.getAssetInfo(assetId);
    if (!assetInfo) return null;

    // Create sprite
    const sprite = this.scene.physics.add.sprite(x, y, spriteKey);
    
    // Apply standardized scale
    sprite.setScale(assetInfo.dimensions.targetScale);
    
    // Set collision box from registry
    const collision = assetInfo.dimensions.collisionBox;
    sprite.body.setSize(collision.width, collision.height);
    
    // Store asset info for reference
    sprite.assetInfo = assetInfo;
    
    return sprite;
  }

  /**
   * Create a background with proper fitting
   */
  createBackground(assetId, spriteKey) {
    const assetInfo = this.getAssetInfo(assetId);
    if (!assetInfo) return null;

    const bg = this.scene.add.image(this.gameWidth/2, this.gameHeight/2, spriteKey);
    bg.setDisplaySize(this.gameWidth, this.gameHeight);
    bg.assetInfo = assetInfo;
    
    return bg;
  }

  /**
   * Create a player with standard ground positioning
   */
  createPlayer(assetId, spriteKey, startX = 64) {
    return this.createSprite(startX, this.layout.groundLevel, assetId, spriteKey);
  }

  /**
   * Create an enemy on a platform surface
   */
  createEnemyOnPlatform(assetId, spriteKey, platformX, platformY) {
    const enemyY = platformY - this.gridSize;
    return this.createSprite(platformX, enemyY, assetId, spriteKey);
  }

  /**
   * Create a collectible floating above a platform
   */
  createCollectibleAbovePlatform(assetId, spriteKey, platformX, platformY) {
    const collectibleY = platformY - this.gridSize * 1.5;
    return this.createSprite(platformX, collectibleY, assetId, spriteKey);
  }

  /**
   * Create a platform aligned to grid
   */
  createPlatform(assetId, spriteKey, gridX, level) {
    const x = gridX * this.gridSize;
    const y = this.layout[`platform${level}`] || this.layout.groundLevel;
    return this.createSprite(x, y, assetId, spriteKey);
  }

  /**
   * Get smart positioning for different sprite types
   */
  getSmartPosition(assetId, baseX, baseY) {
    const assetInfo = this.getAssetInfo(assetId);
    if (!assetInfo) return { x: baseX, y: baseY };

    const type = assetInfo.type;
    
    switch (type) {
      case 'character':
        return { x: baseX, y: this.layout.groundLevel };
      
      case 'enemy':
        // Snap to nearest platform level
        const nearestPlatform = this.getNearestPlatformLevel(baseY);
        return { x: baseX, y: nearestPlatform - this.gridSize };
      
      case 'collectible':
        // Float above nearest platform
        const platformLevel = this.getNearestPlatformLevel(baseY);
        return { x: baseX, y: platformLevel - this.gridSize * 1.5 };
      
      case 'platform':
        // Snap to grid
        return { 
          x: Math.round(baseX / this.gridSize) * this.gridSize,
          y: Math.round(baseY / this.gridSize) * this.gridSize
        };
      
      default:
        return { x: baseX, y: baseY };
    }
  }

  /**
   * Find the nearest platform level to a given Y coordinate
   */
  getNearestPlatformLevel(y) {
    const levels = [
      this.layout.groundLevel,
      this.layout.platform1,
      this.layout.platform2, 
      this.layout.platform3,
      this.layout.platform4
    ];

    return levels.reduce((closest, level) => {
      return Math.abs(level - y) < Math.abs(closest - y) ? level : closest;
    });
  }

  /**
   * Batch create multiple sprites with smart positioning
   */
  createSpriteGroup(spriteDefinitions) {
    const sprites = [];
    
    for (const def of spriteDefinitions) {
      const position = this.getSmartPosition(def.assetId, def.x, def.y);
      const sprite = this.createSprite(position.x, position.y, def.assetId, def.spriteKey);
      if (sprite) {
        sprites.push(sprite);
      }
    }
    
    return sprites;
  }

  /**
   * Create a complete level layout with proper spacing
   */
  createLevelLayout(levelConfig) {
    const elements = {
      background: null,
      player: null,
      platforms: [],
      enemies: [],
      collectibles: [],
      goals: []
    };

    // Background
    if (levelConfig.background) {
      elements.background = this.createBackground(
        levelConfig.background.assetId, 
        levelConfig.background.spriteKey
      );
    }

    // Player
    if (levelConfig.player) {
      elements.player = this.createPlayer(
        levelConfig.player.assetId, 
        levelConfig.player.spriteKey,
        levelConfig.player.startX
      );
    }

    // Platforms
    if (levelConfig.platforms) {
      for (const platform of levelConfig.platforms) {
        const p = this.createPlatform(
          platform.assetId,
          platform.spriteKey,
          platform.gridX,
          platform.level
        );
        if (p) elements.platforms.push(p);
      }
    }

    // Enemies (positioned on platforms)
    if (levelConfig.enemies) {
      for (const enemy of levelConfig.enemies) {
        const platform = elements.platforms[enemy.platformIndex] || { x: enemy.x, y: this.layout.groundLevel };
        const e = this.createEnemyOnPlatform(
          enemy.assetId,
          enemy.spriteKey, 
          platform.x,
          platform.y
        );
        if (e) elements.enemies.push(e);
      }
    }

    // Collectibles (floating above platforms)
    if (levelConfig.collectibles) {
      for (const collectible of levelConfig.collectibles) {
        const platform = elements.platforms[collectible.platformIndex] || { x: collectible.x, y: this.layout.groundLevel };
        const c = this.createCollectibleAbovePlatform(
          collectible.assetId,
          collectible.spriteKey,
          platform.x,
          platform.y
        );
        if (c) elements.collectibles.push(c);
      }
    }

    return elements;
  }

  /**
   * Debug function to visualize the grid system
   */
  showGrid() {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(1, 0x00ff00, 0.3);

    // Vertical lines
    for (let x = 0; x <= this.gameWidth; x += this.gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, this.gameHeight);
    }

    // Horizontal lines  
    for (let y = 0; y <= this.gameHeight; y += this.gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(this.gameWidth, y);
    }

    graphics.strokePath();

    // Mark standard levels
    const levelGraphics = this.scene.add.graphics();
    levelGraphics.lineStyle(2, 0xff0000, 0.8);
    
    Object.values(this.layout).forEach(y => {
      levelGraphics.moveTo(0, y);
      levelGraphics.lineTo(this.gameWidth, y);
    });
    
    levelGraphics.strokePath();
    
    return { grid: graphics, levels: levelGraphics };
  }
}

// Export for use in games
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameAssetHelper;
} else {
  window.GameAssetHelper = GameAssetHelper;
} 