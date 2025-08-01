/**
 * Uniform Asset Helper - For Same-Sized Sprites (64x64)
 * 
 * This helper is specifically designed for uniform assets where all sprites
 * are the same size. No complex scaling calculations needed!
 * 
 * Features:
 * - All sprites are 64x64 pixels
 * - Use scale 1.0 for pixel-perfect rendering
 * - Simple grid-based positioning
 * - Easy asset selection by tags
 * - Perfect collision detection
 */

class UniformAssetHelper {
  constructor(scene, gameWidth = 800, gameHeight = 600) {
    this.scene = scene;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.assetRegistry = null;
    
    // Uniform sprite settings
    this.spriteSize = 64;    // All sprites are 64x64
    this.scale = 1.0;        // Pixel perfect rendering
    this.gridSize = 32;      // Game grid unit (half sprite size)
    
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
   * Load the uniform asset registry
   */
  async loadAssetRegistry() {
    try {
      const response = await fetch('/assets/platformer-assets-curated.json');
      this.assetRegistry = await response.json();
      console.log('✅ Uniform Asset Registry loaded:', this.assetRegistry.usage.assetCount);
      return true;
    } catch (error) {
      console.error('❌ Failed to load asset registry:', error);
      return false;
    }
  }

  /**
   * Get asset info by ID
   */
  getAssetInfo(assetId) {
    if (!this.assetRegistry) return null;
    
    for (const category of Object.values(this.assetRegistry.categories)) {
      const asset = category.assets.find(a => a.id === assetId);
      if (asset) return asset;
    }
    return null;
  }

  /**
   * Find assets by tags
   */
  findAssetsByTags(tags, limit = 10) {
    if (!this.assetRegistry) return [];
    
    const results = [];
    for (const category of Object.values(this.assetRegistry.categories)) {
      for (const asset of category.assets) {
        if (tags.some(tag => asset.tags.includes(tag))) {
          results.push(asset);
          if (results.length >= limit) return results;
        }
      }
    }
    return results;
  }

  /**
   * Create a sprite with uniform sizing (64x64, scale 1.0)
   */
  createSprite(x, y, assetId, spriteKey, collisionWidth = 48, collisionHeight = 60) {
    const assetInfo = this.getAssetInfo(assetId);
    if (!assetInfo) {
      console.warn(`Asset not found: ${assetId}`);
      return null;
    }

    const sprite = this.scene.physics.add.sprite(x, y, spriteKey);
    sprite.setScale(this.scale); // Always 1.0 for pixel perfect
    sprite.body.setSize(collisionWidth, collisionHeight);
    sprite.assetInfo = assetInfo;
    
    return sprite;
  }

  /**
   * Create Phaser graphics background (NO image assets needed!)
   */
  createBackground(theme = 'sky') {
    return this.createPhaserBackground(theme);
  }
  
  /**
   * Create background using pure Phaser graphics - much better than images!
   */
  createPhaserBackground(theme = 'sky') {
    const backgrounds = {
      sky: () => {
        const skyGradient = this.scene.add.graphics();
        skyGradient.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x98D8FF, 0x98D8FF, 1);
        skyGradient.fillRect(0, 0, this.gameWidth, this.gameHeight);
        return skyGradient;
      },
      desert: () => {
        const desertGradient = this.scene.add.graphics();
        desertGradient.fillGradientStyle(0xF4A460, 0xF4A460, 0xFFD700, 0xFFD700, 1);
        desertGradient.fillRect(0, 0, this.gameWidth, this.gameHeight);
        return desertGradient;
      },
      forest: () => {
        const forestGradient = this.scene.add.graphics();
        forestGradient.fillGradientStyle(0x228B22, 0x228B22, 0x32CD32, 0x32CD32, 1);
        forestGradient.fillRect(0, 0, this.gameWidth, this.gameHeight);
        return forestGradient;
      },
      night: () => {
        const nightGradient = this.scene.add.graphics();
        nightGradient.fillGradientStyle(0x191970, 0x191970, 0x000080, 0x000080, 1);
        nightGradient.fillRect(0, 0, this.gameWidth, this.gameHeight);
        return nightGradient;
      },
      mario: () => {
        // Classic Mario sky blue
        const marioSky = this.scene.add.graphics();
        marioSky.fillGradientStyle(0x5C94FC, 0x5C94FC, 0x87CEEB, 0x87CEEB, 1);
        marioSky.fillRect(0, 0, this.gameWidth, this.gameHeight);
        return marioSky;
      }
    };
    
    const background = backgrounds[theme] ? backgrounds[theme]() : backgrounds.sky();
    console.log(`✅ Phaser ${theme} background created - no image assets needed!`);
    return background;
  }

  /**
   * Create a player with standard positioning
   */
  createPlayer(assetId, spriteKey, startX = 64) {
    return this.createSprite(startX, this.layout.groundLevel, assetId, spriteKey, 48, 60);
  }

  /**
   * Create an enemy on a platform
   */
  createEnemyOnPlatform(assetId, spriteKey, platformX, platformY) {
    const enemyY = platformY - this.spriteSize;
    return this.createSprite(platformX, enemyY, assetId, spriteKey, 48, 48);
  }

  /**
   * Create a collectible floating above a platform
   */
  createCollectibleAbovePlatform(assetId, spriteKey, platformX, platformY) {
    const collectibleY = platformY - this.spriteSize - 16;
    return this.createSprite(platformX, collectibleY, assetId, spriteKey, 40, 40);
  }

  /**
   * Create a platform at grid position
   */
  createPlatform(assetId, spriteKey, gridX, level) {
    const x = gridX * this.gridSize;
    const y = this.layout[`platform${level}`] || this.layout.groundLevel;
    return this.createSprite(x, y, assetId, spriteKey, 64, 32);
  }

  /**
   * Create a complete themed game level
   */
  createThemedLevel(theme = 'simple') {
    // Use Mario-appropriate assets instead of grass
    const marioTheme = {
      player: 'character_beige_idle',
      enemy: 'snail_walk_a', 
      platform: 'terrain_stone_block', // STONE/BRICK for Mario, NOT grass
      collectible: 'coin_bronze',
      background: 'background_color_hills'
    };
    
    const themes = {
      simple: marioTheme,
      mario: marioTheme,
      desert: {
        player: 'character_yellow_idle',
        enemy: 'mouse_walk_a',
        platform: 'terrain_sand_block',
        collectible: 'gem_yellow',
        background: 'background_color_desert'
      },
      winter: {
        player: 'character_purple_idle',
        enemy: 'slime_normal_walk_a',
        platform: 'terrain_snow_block',
        collectible: 'gem_blue',
        background: 'background_fade_hills'
      }
    };
    
    const selectedTheme = themes[theme] || themes.simple;
    
    const elements = {
      background: null,
      player: null,
      platforms: [],
      enemies: [],
      collectibles: []
    };

    // Background
    elements.background = this.createBackground(
      selectedTheme.background, 
      'background'
    );

    // Player
    elements.player = this.createPlayer(
      selectedTheme.player,
      'player',
      64
    );

    // Create a simple level layout
    const platformPositions = [
      { x: 6, level: 1 },
      { x: 12, level: 2 },
      { x: 18, level: 1 },
      { x: 24, level: 3 }
    ];

    // Platforms
    for (const pos of platformPositions) {
      const platform = this.createPlatform(
        selectedTheme.platform,
        'platform',
        pos.x,
        pos.level
      );
      if (platform) elements.platforms.push(platform);
    }

    // Enemies on platforms
    if (elements.platforms.length > 0) {
      const enemy = this.createEnemyOnPlatform(
        selectedTheme.enemy,
        'enemy',
        elements.platforms[0].x,
        elements.platforms[0].y
      );
      if (enemy) elements.enemies.push(enemy);
    }

    // Collectibles above platforms
    for (let i = 1; i < elements.platforms.length; i++) {
      const collectible = this.createCollectibleAbovePlatform(
        selectedTheme.collectible,
        'collectible',
        elements.platforms[i].x,
        elements.platforms[i].y
      );
      if (collectible) elements.collectibles.push(collectible);
    }

    return elements;
  }

  /**
   * Build a platform chain (left-middle-right pieces)
   */
  createPlatformChain(startX, y, length, theme = 'grass') {
    const platforms = [];
    
    for (let i = 0; i < length; i++) {
      let assetId;
      if (i === 0) {
        assetId = `terrain_${theme}_horizontal_left`;
      } else if (i === length - 1) {
        assetId = `terrain_${theme}_horizontal_right`;
      } else {
        assetId = `terrain_${theme}_horizontal_middle`;
      }
      
      const platform = this.createSprite(
        startX + (i * this.spriteSize), 
        y, 
        assetId, 
        `platform_${i}`,
        64, 32
      );
      
      if (platform) platforms.push(platform);
    }
    
    return platforms;
  }

  /**
   * Preload all assets from a theme
   */
  preloadThemeAssets(theme = 'simple') {
    // Use same Mario-appropriate themes as createThemedLevel
    const marioTheme = {
      player: 'character_beige_idle',
      enemy: 'snail_walk_a', 
      platform: 'terrain_stone_block', // STONE for Mario, NOT grass
      collectible: 'coin_bronze',
      background: 'background_color_hills'
    };
    
    const themes = {
      simple: marioTheme,
      mario: marioTheme,
      desert: {
        player: 'character_yellow_idle',
        enemy: 'mouse_walk_a',
        platform: 'terrain_sand_block',
        collectible: 'gem_yellow',
        background: 'background_color_desert'
      }
    };
    
    const selectedTheme = themes[theme] || themes.simple;
    
    const loadList = [];
    
    // Add theme assets to load list
    Object.entries(selectedTheme).forEach(([key, assetId]) => {
      const assetInfo = this.getAssetInfo(assetId);
      if (assetInfo) {
        loadList.push({
          key: key,
          url: assetInfo.url
        });
      }
    });
    
    return loadList;
  }

  /**
   * Get recommended collision sizes for different sprite types
   */
  getCollisionSize(assetType) {
    const sizes = {
      character: { width: 48, height: 60 },
      enemy: { width: 48, height: 48 },
      platform: { width: 64, height: 32 },
      collectible: { width: 40, height: 40 },
      hazard: { width: 56, height: 56 }
    };
    
    return sizes[assetType] || { width: 48, height: 48 };
  }

  /**
   * Debug function to show grid
   */
  showGrid() {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(1, 0x00ff00, 0.3);
    
    // Vertical grid lines
    for (let x = 0; x <= this.gameWidth; x += this.gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, this.gameHeight);
    }
    
    // Horizontal grid lines
    for (let y = 0; y <= this.gameHeight; y += this.gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(this.gameWidth, y);
    }
    
    graphics.strokePath();
    
    // Show platform levels
    const levelGraphics = this.scene.add.graphics();
    levelGraphics.lineStyle(2, 0xff0000, 0.5);
    
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
  module.exports = UniformAssetHelper;
} else {
  window.UniformAssetHelper = UniformAssetHelper;
} 