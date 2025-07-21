/**
 * Hybrid Asset Loader
 * 
 * Provides a unified interface for loading assets that can seamlessly
 * switch between dynamic and static loading based on configuration or runtime conditions.
 */

import { assetLoader } from './asset-loader';
import { AssetErrorType, assetErrorHandler } from './error-handler';
import { rollbackManager } from './rollback-manager';

/**
 * Configuration for the hybrid loader
 */
export interface HybridLoaderConfig {
  preferDynamic: boolean;
  staticBasePath: string;
  enableFallback: boolean;
  cacheResults: boolean;
  logLoadingDetails: boolean;
}

/**
 * Asset type for hybrid loading
 */
export interface HybridAsset {
  key: string;
  dynamicCriteria?: any;
  staticPath: string;
  type: 'image' | 'spritesheet' | 'atlas' | 'audio' | 'json';
  options?: any;
}

/**
 * Hybrid loader that can switch between dynamic and static asset loading
 */
export class HybridLoader {
  private config: HybridLoaderConfig;
  private scene: any; // Phaser Scene
  private loadedAssets: Map<string, { dynamic: boolean, path: string }> = new Map();
  
  constructor(scene: any, config?: Partial<HybridLoaderConfig>) {
    this.scene = scene;
    this.config = {
      preferDynamic: true,
      staticBasePath: '',
      enableFallback: true,
      cacheResults: true,
      logLoadingDetails: true,
      ...config
    };
  }
  
  /**
   * Load an asset using the appropriate method
   */
  async loadAsset(asset: HybridAsset): Promise<boolean> {
    // Check if we should use dynamic loading
    const useDynamic = this.config.preferDynamic && rollbackManager.isDynamicLoadingEnabled();
    
    try {
      if (useDynamic && asset.dynamicCriteria) {
        // Try dynamic loading first
        const success = await this.loadDynamicAsset(asset);
        if (success) return true;
        
        // Fall back to static if dynamic fails and fallback is enabled
        if (this.config.enableFallback) {
          if (this.config.logLoadingDetails) {
            console.log(`🔄 Falling back to static asset for ${asset.key}`);
          }
          return this.loadStaticAsset(asset);
        }
        
        return false;
      } else {
        // Use static loading
        return this.loadStaticAsset(asset);
      }
    } catch (error) {
      assetErrorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        `Failed to load asset: ${asset.key}`,
        error instanceof Error ? error : new Error(String(error)),
        { name: asset.key }
      );
      return false;
    }
  }
  
  /**
   * Load an asset dynamically
   */
  private async loadDynamicAsset(asset: HybridAsset): Promise<boolean> {
    try {
      // Get dynamic URL
      const url = await assetLoader.getAssetUrl(asset.dynamicCriteria);
      
      if (!url) {
        if (this.config.logLoadingDetails) {
          console.warn(`⚠️ No dynamic asset found for ${asset.key}`);
        }
        return false;
      }
      
      // Load the asset based on type
      return new Promise<boolean>(resolve => {
        // Set up success handler
        this.scene.load.once(`filecomplete-${asset.type}-${asset.key}`, () => {
          if (this.config.logLoadingDetails) {
            console.log(`✅ Dynamically loaded ${asset.key}`);
          }
          
          // Store loaded asset info
          if (this.config.cacheResults) {
            this.loadedAssets.set(asset.key, { dynamic: true, path: url });
          }
          
          resolve(true);
        });
        
        // Set up error handler
        this.scene.load.once(`loaderror`, () => {
          if (this.config.logLoadingDetails) {
            console.error(`❌ Failed to dynamically load ${asset.key}`);
          }
          resolve(false);
        });
        
        // Load the asset
        switch (asset.type) {
          case 'image':
            this.scene.load.image(asset.key, url);
            break;
          case 'spritesheet':
            this.scene.load.spritesheet(asset.key, url, asset.options);
            break;
          case 'atlas':
            this.scene.load.atlas(asset.key, url, asset.options);
            break;
          case 'audio':
            this.scene.load.audio(asset.key, url);
            break;
          case 'json':
            this.scene.load.json(asset.key, url);
            break;
        }
        
        // Start loading if not already started
        if (this.scene.load.isLoading()) {
          // Already loading, our handlers will be called
        } else {
          this.scene.load.start();
        }
      });
    } catch (error) {
      if (this.config.logLoadingDetails) {
        console.error(`❌ Error in dynamic loading for ${asset.key}:`, error);
      }
      return false;
    }
  }
  
  /**
   * Load an asset statically
   */
  private loadStaticAsset(asset: HybridAsset): boolean {
    try {
      // Construct full path
      const path = this.config.staticBasePath ? 
        `${this.config.staticBasePath}/${asset.staticPath}` : 
        asset.staticPath;
      
      // Load the asset based on type
      switch (asset.type) {
        case 'image':
          this.scene.load.image(asset.key, path);
          break;
        case 'spritesheet':
          this.scene.load.spritesheet(asset.key, path, asset.options);
          break;
        case 'atlas':
          this.scene.load.atlas(asset.key, path, asset.options);
          break;
        case 'audio':
          this.scene.load.audio(asset.key, path);
          break;
        case 'json':
          this.scene.load.json(asset.key, path);
          break;
      }
      
      // Store loaded asset info
      if (this.config.cacheResults) {
        this.loadedAssets.set(asset.key, { dynamic: false, path });
      }
      
      if (this.config.logLoadingDetails) {
        console.log(`✅ Statically loaded ${asset.key}`);
      }
      
      return true;
    } catch (error) {
      if (this.config.logLoadingDetails) {
        console.error(`❌ Error in static loading for ${asset.key}:`, error);
      }
      return false;
    }
  }
  
  /**
   * Load multiple assets
   */
  async loadAssets(assets: HybridAsset[]): Promise<number> {
    let successCount = 0;
    
    for (const asset of assets) {
      const success = await this.loadAsset(asset);
      if (success) successCount++;
    }
    
    return successCount;
  }
  
  /**
   * Get statistics about loaded assets
   */
  getStats(): {
    totalAssets: number;
    dynamicAssets: number;
    staticAssets: number;
    dynamicPercentage: number;
  } {
    let dynamicCount = 0;
    let staticCount = 0;
    
    this.loadedAssets.forEach(info => {
      if (info.dynamic) {
        dynamicCount++;
      } else {
        staticCount++;
      }
    });
    
    const total = dynamicCount + staticCount;
    const dynamicPercentage = total > 0 ? (dynamicCount / total) * 100 : 0;
    
    return {
      totalAssets: total,
      dynamicAssets: dynamicCount,
      staticAssets: staticCount,
      dynamicPercentage
    };
  }
  
  /**
   * Set preference for dynamic vs static loading
   */
  setPreferDynamic(preferDynamic: boolean): void {
    this.config.preferDynamic = preferDynamic;
  }
  
  /**
   * Clear loaded assets cache
   */
  clearCache(): void {
    this.loadedAssets.clear();
  }
}

/**
 * Create a hybrid loader for a Phaser scene
 */
export function createHybridLoader(scene: any, config?: Partial<HybridLoaderConfig>): HybridLoader {
  return new HybridLoader(scene, config);
}