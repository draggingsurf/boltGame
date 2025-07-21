/**
 * Backward Compatibility Layer for Dynamic Asset Loading
 * 
 * This module provides compatibility with existing static asset loading patterns,
 * allowing for a gradual migration to the dynamic asset system.
 */

import { assetLoader } from './asset-loader';
import { migrationHelper } from './migration-helper';
import { AssetErrorType, assetErrorHandler } from './error-handler';

/**
 * Configuration for the compatibility layer
 */
export interface CompatibilityConfig {
  enableHybridMode: boolean;
  preferDynamic: boolean;
  fallbackToStatic: boolean;
  logMigrationSuggestions: boolean;
  autoMigrate: boolean;
}

/**
 * Compatibility layer for existing Phaser games
 */
export class CompatibilityLayer {
  private config: CompatibilityConfig;
  private staticAssetPaths: Map<string, string> = new Map();
  private dynamicAssetKeys: Set<string> = new Set();
  private scene: any; // Phaser Scene
  
  constructor(scene: any, config?: Partial<CompatibilityConfig>) {
    this.scene = scene;
    this.config = {
      enableHybridMode: true,
      preferDynamic: true,
      fallbackToStatic: true,
      logMigrationSuggestions: true,
      autoMigrate: false,
      ...config
    };
    
    // Patch Phaser's loader to intercept static asset loading
    this.patchPhaserLoader();
  }
  
  /**
   * Patch Phaser's loader to intercept static asset loading
   */
  private patchPhaserLoader(): void {
    if (!this.scene || !this.scene.load) return;
    
    // Store original image loading function
    const originalImageLoad = this.scene.load.image;
    
    // Replace with our interceptor
    this.scene.load.image = (key: string, url: string, ...args: any[]) => {
      // Store the static path for potential fallback
      this.staticAssetPaths.set(key, url);
      
      if (this.config.enableHybridMode && this.config.preferDynamic) {
        // Try to load dynamically first
        this.tryDynamicLoad(key, url).then(success => {
          if (!success && this.config.fallbackToStatic) {
            // Fall back to static loading if dynamic fails
            console.log(`🔄 Falling back to static asset for ${key}: ${url}`);
            originalImageLoad.call(this.scene.load, key, url, ...args);
          }
        });
        
        // Return the loader for chaining
        return this.scene.load;
      } else {
        // Just use the original loader
        return originalImageLoad.call(this.scene.load, key, url, ...args);
      }
    };
    
    // Log migration suggestions if enabled
    if (this.config.logMigrationSuggestions) {
      console.log('🔍 Compatibility layer active - monitoring static asset usage');
      console.log('💡 Run migrationHelper.analyzeCode() to get migration suggestions');
    }
  }
  
  /**
   * Try to load an asset dynamically based on static path
   */
  private async tryDynamicLoad(key: string, staticPath: string): Promise<boolean> {
    try {
      // Check if we have a mapping for this static path
      const mapping = migrationHelper.getMappingForPath(staticPath);
      
      if (mapping) {
        // Get dynamic URL
        const dynamicUrl = await assetLoader.getAssetUrl(mapping.searchCriteria);
        
        if (dynamicUrl) {
          console.log(`🔄 Replacing static asset ${key} with dynamic asset`);
          
          // Load the dynamic asset
          this.scene.load.image(key, dynamicUrl);
          this.dynamicAssetKeys.add(key);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      assetErrorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        `Failed to dynamically load asset for ${key}`,
        error instanceof Error ? error : new Error(String(error)),
        { name: key, url: staticPath }
      );
      return false;
    }
  }
  
  /**
   * Get migration suggestions for the current game
   */
  getMigrationSuggestions(): {
    staticAssets: string[];
    dynamicAssets: string[];
    suggestions: string[];
    migrationCode: string;
  } {
    const staticAssets = Array.from(this.staticAssetPaths.values());
    const dynamicAssets = Array.from(this.dynamicAssetKeys);
    
    // Generate suggestions
    const suggestions = staticAssets.map(path => {
      const mapping = migrationHelper.getMappingForPath(path);
      if (mapping) {
        return `✅ Can migrate: ${path} → ${mapping.searchCriteria.subcategory}/${mapping.searchCriteria.tags?.join(', ')}`;
      } else {
        return `⚠️ Manual migration needed: ${path}`;
      }
    });
    
    // Generate migration code
    const migrationCode = migrationHelper.generateMigrationCode(staticAssets);
    
    return {
      staticAssets,
      dynamicAssets,
      suggestions,
      migrationCode
    };
  }
  
  /**
   * Perform automatic migration of static assets to dynamic
   */
  async autoMigrate(): Promise<boolean> {
    if (!this.config.autoMigrate) {
      console.warn('Auto-migration is disabled in compatibility layer config');
      return false;
    }
    
    try {
      const staticAssets = Array.from(this.staticAssetPaths.values());
      const dynamicAssets = await migrationHelper.convertStaticToDynamic(staticAssets);
      
      console.log(`✅ Auto-migrated ${Object.keys(dynamicAssets).length} assets to dynamic loading`);
      return true;
    } catch (error) {
      console.error('❌ Auto-migration failed:', error);
      return false;
    }
  }
  
  /**
   * Enable or disable hybrid mode
   */
  setHybridMode(enabled: boolean): void {
    this.config.enableHybridMode = enabled;
  }
  
  /**
   * Set preference for dynamic vs static assets
   */
  setPreferDynamic(preferDynamic: boolean): void {
    this.config.preferDynamic = preferDynamic;
  }
  
  /**
   * Get statistics about asset loading
   */
  getStats(): {
    staticAssetCount: number;
    dynamicAssetCount: number;
    hybridModeEnabled: boolean;
    preferDynamic: boolean;
  } {
    return {
      staticAssetCount: this.staticAssetPaths.size,
      dynamicAssetCount: this.dynamicAssetKeys.size,
      hybridModeEnabled: this.config.enableHybridMode,
      preferDynamic: this.config.preferDynamic
    };
  }
}

/**
 * Create a compatibility layer for a Phaser scene
 */
export function createCompatibilityLayer(scene: any, config?: Partial<CompatibilityConfig>): CompatibilityLayer {
  return new CompatibilityLayer(scene, config);
}

/**
 * Helper function to patch an existing Phaser game for backward compatibility
 */
export function patchExistingGame(game: any, config?: Partial<CompatibilityConfig>): void {
  if (!game || !game.scene) {
    console.error('❌ Invalid game object provided to patchExistingGame');
    return;
  }
  
  // Create compatibility layer for each scene
  game.scene.scenes.forEach((scene: any) => {
    new CompatibilityLayer(scene, config);
  });
  
  console.log('✅ Game patched with compatibility layer');
}