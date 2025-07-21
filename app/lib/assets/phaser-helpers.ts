/**
 * Phaser Integration Helpers for Dynamic Asset Loading
 */

import { assetLoader } from './asset-loader';
import { AssetErrorType, assetErrorHandler, safeLoadAsset } from './error-handler';

/**
 * Enhanced preload helper that loads assets dynamically from Supabase
 */
export class PhaserAssetHelper {
  private scene: any; // Phaser Scene
  private loadingText: any; // Loading text display
  private progressBar: any; // Loading progress bar
  private progressBox: any; // Loading progress box
  private loadingAssets: Map<string, boolean> = new Map(); // Track loading status

  constructor(scene: any) {
    this.scene = scene;
  }

  /**
   * Show loading UI
   */
  showLoadingUI(text: string = 'Loading assets...'): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Create loading box
    this.progressBox = this.scene.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
    
    // Create progress bar
    this.progressBar = this.scene.add.graphics();
    
    // Create loading text
    this.loadingText = this.scene.add.text(width / 2, height / 2 - 50, text, {
      font: '18px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Add progress percentage text
    const percentText = this.scene.add.text(width / 2, height / 2 + 40, '0%', {
      font: '18px Arial',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Update progress bar
    this.scene.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x9AD98D, 1);
      this.progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
      percentText.setText(parseInt((value * 100).toString()) + '%');
    });
    
    // Clean up when complete
    this.scene.load.on('complete', () => {
      this.hideLoadingUI();
    });
  }
  
  /**
   * Hide loading UI
   */
  hideLoadingUI(): void {
    if (this.progressBar) {
      this.progressBar.destroy();
      this.progressBar = null;
    }
    
    if (this.progressBox) {
      this.progressBox.destroy();
      this.progressBox = null;
    }
    
    if (this.loadingText) {
      this.loadingText.destroy();
      this.loadingText = null;
    }
  }

  /**
   * Load basic platformer assets dynamically with error handling
   */
  async loadBasicAssets(): Promise<void> {
    this.showLoadingUI('Loading game assets...');
    
    try {
      const assets = await safeLoadAsset(
        () => assetLoader.getGameAssets(),
        { name: 'Basic Game Assets', category: 'game' },
        AssetErrorType.ASSET_LOAD_FAILED
      );
      
      if (!assets) {
        throw new Error('Failed to load game assets');
      }
      
      // Track loaded assets
      let loadedCount = 0;
      const totalAssets = Object.values(assets).filter(url => url).length;
      
      // Setup loading complete handler
      const onLoadComplete = () => {
        loadedCount++;
        if (loadedCount >= totalAssets) {
          console.log('✅ Dynamic assets loaded successfully');
          this.hideLoadingUI();
        }
      };
      
      // Load player assets
      if (assets.player) {
        this.loadAssetWithErrorHandling('player', assets.player, onLoadComplete);
      }
      
      // Load enemy assets
      if (assets.enemy) {
        this.loadAssetWithErrorHandling('enemy', assets.enemy, onLoadComplete);
      }
      
      // Load tile assets
      if (assets.tile) {
        this.loadAssetWithErrorHandling('ground', assets.tile, onLoadComplete);
      }
      
      // Load coin assets
      if (assets.coin) {
        this.loadAssetWithErrorHandling('coin', assets.coin, onLoadComplete);
      }
      
      // Load background assets
      if (assets.background) {
        this.loadAssetWithErrorHandling('background', assets.background, onLoadComplete);
      }
      
      // Start loading
      this.scene.load.start();
      
    } catch (error) {
      console.error('❌ Failed to load dynamic assets:', error);
      assetErrorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        'Failed to load basic game assets',
        error instanceof Error ? error : new Error(String(error)),
        { name: 'Basic Game Assets', category: 'game' }
      );
      
      // Fallback to default assets if available
      this.loadFallbackAssets();
    }
  }
  
  /**
   * Load an asset with error handling
   */
  private loadAssetWithErrorHandling(key: string, url: string, onComplete?: () => void): void {
    // Track this asset
    this.loadingAssets.set(key, false);
    
    // Add error handler
    this.scene.load.on(`loaderror-${key}`, () => {
      console.error(`❌ Failed to load asset: ${key}`);
      assetErrorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        `Failed to load asset: ${key}`,
        new Error(`Failed to load: ${url}`),
        { name: key, url, category: 'game' }
      );
      
      // Load fallback for this specific asset
      this.loadFallbackAsset(key);
      
      // Mark as loaded (even though it failed)
      this.loadingAssets.set(key, true);
      if (onComplete) onComplete();
    });
    
    // Add success handler
    this.scene.load.on(`filecomplete-image-${key}`, () => {
      console.log(`✅ Successfully loaded asset: ${key}`);
      this.loadingAssets.set(key, true);
      if (onComplete) onComplete();
    });
    
    // Start loading
    this.scene.load.image(key, url);
  }

  /**
   * Load character animation set
   */
  async loadCharacterAnimations(color: string = 'beige'): Promise<void> {
    const animations = ['idle', 'walk', 'jump', 'climb', 'duck'];
    
    for (const animation of animations) {
      const url = await assetLoader.getPlayerSprite(color, animation);
      if (url) {
        this.scene.load.image(`player-${animation}`, url);
      }
    }
  }

  /**
   * Load multiple enemy types
   */
  async loadEnemyVariants(): Promise<void> {
    const enemyTypes = ['slime', 'bee', 'frog', 'mouse'];
    
    for (const enemyType of enemyTypes) {
      const url = await assetLoader.getEnemySprite(enemyType);
      if (url) {
        this.scene.load.image(`enemy-${enemyType}`, url);
      }
    }
  }

  /**
   * Load terrain variety
   */
  async loadTerrainTiles(): Promise<void> {
    const terrainTypes = ['grass', 'dirt', 'sand', 'stone'];
    
    for (const terrainType of terrainTypes) {
      const url = await assetLoader.getTileSprite(terrainType);
      if (url) {
        this.scene.load.image(`tile-${terrainType}`, url);
      }
    }
  }

  /**
   * Load a fallback asset for a specific key
   */
  private loadFallbackAsset(key: string): void {
    console.log(`🔄 Loading fallback asset for: ${key}`);
    
    // Map of fallback assets by key
    const fallbackMap: Record<string, string> = {
      'player': '/sprites/player.svg',
      'enemy': '/sprites/enemy.svg',
      'ground': '/sprites/ground.svg',
      'coin': '/sprites/coin.svg',
      'background': '/backgrounds/sky.svg'
    };
    
    // Get fallback path for this key
    const fallbackPath = fallbackMap[key];
    
    if (fallbackPath) {
      try {
        this.scene.load.image(key, fallbackPath);
        console.log(`✅ Loaded fallback asset for ${key}: ${fallbackPath}`);
      } catch (error) {
        console.warn(`Could not load fallback asset for ${key}: ${error}`);
      }
    } else {
      console.warn(`No fallback asset defined for key: ${key}`);
    }
  }

  /**
   * Fallback asset loading for when dynamic loading fails
   */
  private loadFallbackAssets(): void {
    console.log('🔄 Loading fallback assets...');
    
    // Use local fallback assets if they exist
    const fallbackAssets = [
      { key: 'player', path: '/sprites/player.svg' },
      { key: 'enemy', path: '/sprites/enemy.svg' },
      { key: 'ground', path: '/sprites/ground.svg' },
      { key: 'coin', path: '/sprites/coin.svg' },
      { key: 'background', path: '/backgrounds/sky.svg' }
    ];

    fallbackAssets.forEach(asset => {
      try {
        this.scene.load.image(asset.key, asset.path);
      } catch (error) {
        console.warn(`Could not load fallback asset: ${asset.key}`);
      }
    });
  }
}

/**
 * Convenience functions for quick asset loading
 */

/**
 * Quick setup for a basic platformer game
 */
export async function loadPlatformerAssets(scene: any): Promise<void> {
  const helper = new PhaserAssetHelper(scene);
  await helper.loadBasicAssets();
}

/**
 * Load assets for a character-focused game
 */
export async function loadCharacterGame(scene: any, characterColor: string = 'beige'): Promise<void> {
  const helper = new PhaserAssetHelper(scene);
  await helper.loadBasicAssets();
  await helper.loadCharacterAnimations(characterColor);
}

/**
 * Load assets for an enemy-heavy game
 */
export async function loadEnemyGame(scene: any): Promise<void> {
  const helper = new PhaserAssetHelper(scene);
  await helper.loadBasicAssets();
  await helper.loadEnemyVariants();
}

/**
 * Load assets for a terrain-focused game
 */
export async function loadTerrainGame(scene: any): Promise<void> {
  const helper = new PhaserAssetHelper(scene);
  await helper.loadBasicAssets();
  await helper.loadTerrainTiles();
}

/**
 * Universal asset loader that handles async preloading
 */
export function createAsyncPreloader(scene: any) {
  return {
    /**
     * Async preload function that can be called from Phaser's preload
     */
    async preloadAssets(assetType: 'basic' | 'character' | 'enemy' | 'terrain' = 'basic', options: any = {}) {
      // Show loading indicator
      const loadingText = scene.add.text(400, 300, 'Loading assets...', {
        fontSize: '24px',
        fill: '#ffffff'
      }).setOrigin(0.5);

      try {
        switch (assetType) {
          case 'basic':
            await loadPlatformerAssets(scene);
            break;
          case 'character':
            await loadCharacterGame(scene, options.color);
            break;
          case 'enemy':
            await loadEnemyGame(scene);
            break;
          case 'terrain':
            await loadTerrainGame(scene);
            break;
        }

        // Remove loading indicator
        loadingText.destroy();
        
        console.log('✅ All assets loaded successfully');
      } catch (error) {
        console.error('❌ Asset loading failed:', error);
        loadingText.setText('Asset loading failed - using fallbacks');
        
        // Clean up after a delay
        setTimeout(() => {
          loadingText.destroy();
        }, 2000);
      }
    }
  };
}