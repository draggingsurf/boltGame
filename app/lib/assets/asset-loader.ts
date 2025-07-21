/**
 * Dynamic Asset Loader for BoltGame
 * Integrates with Supabase asset index for dynamic asset discovery
 */

import { AssetErrorHandler, AssetErrorType, assetErrorHandler, safeLoadAsset } from './error-handler';

export interface AssetSearchCriteria {
  category?: string;
  subcategory?: string;
  tags?: string[];
  name?: string;
  file_type?: string;
  limit?: number;
}

interface GameAsset {
  id: string;
  name: string;
  url: string;
  category: string;
  subcategory: string;
  tags: string[];
  file_type: string;
}

interface GameManifest {
  version: string;
  generated_at: string;
  base_url: string;
  assets: GameAsset[];
  search_index: Record<string, any>;
}

/**
 * Asset Loader class for dynamic asset discovery and loading
 */
export class AssetLoader {
  private manifest: GameManifest | null = null;
  private cache = new Map<string, string>();
  private baseUrl = "https://xptqqsqivdlwaogiftxd.supabase.co/storage/v1/object/public/assets/";
  private errorHandler: AssetErrorHandler;
  private loadingPromise: Promise<GameManifest | null> | null = null;

  constructor(errorHandler?: AssetErrorHandler) {
    this.errorHandler = errorHandler || assetErrorHandler;
  }

  /**
   * Load the asset manifest from the server or local cache
   */
  async loadManifest(): Promise<GameManifest | null> {
    // Return cached manifest if available
    if (this.manifest) return this.manifest;
    
    // Return existing promise if already loading
    if (this.loadingPromise) return this.loadingPromise;
    
    // Create new loading promise
    this.loadingPromise = this._loadManifest();
    return this.loadingPromise;
  }
  
  /**
   * Internal method to load the manifest with error handling
   */
  private async _loadManifest(): Promise<GameManifest | null> {
    try {
      // Try to load from local first (for development)
      const response = await safeLoadAsset(
        () => fetch('/game-asset-manifest.json'),
        { name: 'Asset Manifest', category: 'system' },
        AssetErrorType.MANIFEST_LOAD_FAILED
      );
      
      if (response && response.ok) {
        try {
          this.manifest = await response.json();
          console.log(`✅ Loaded asset manifest with ${this.manifest?.assets?.length || 0} assets`);
          return this.manifest;
        } catch (parseError) {
          this.errorHandler.handleError(
            AssetErrorType.MANIFEST_LOAD_FAILED,
            'Failed to parse manifest JSON',
            parseError instanceof Error ? parseError : new Error(String(parseError)),
            { name: 'Asset Manifest', category: 'system' }
          );
        }
      }
    } catch (error) {
      console.warn('Could not load local manifest, using fallback');
      // Error already handled by safeLoadAsset
    }

    // Fallback: Load a minimal manifest with essential assets
    console.log('🔄 Using fallback asset manifest');
    this.manifest = this.createFallbackManifest();
    return this.manifest;
  }

  /**
   * Create a fallback manifest with essential game assets
   */
  private createFallbackManifest(): GameManifest {
    return {
      version: "1.0.0",
      generated_at: new Date().toISOString(),
      base_url: this.baseUrl,
      assets: [
        {
          id: "fallback-player",
          name: "Character Beige Idle",
          url: `${this.baseUrl}platformer/sprites/characters/character_beige_idle.png`,
          category: "sprites",
          subcategory: "characters",
          tags: ["beige", "idle", "characters"],
          file_type: "png"
        },
        {
          id: "fallback-enemy",
          name: "Slime Block Rest",
          url: `${this.baseUrl}platformer/sprites/enemies/slime_block_rest.png`,
          category: "sprites",
          subcategory: "enemies",
          tags: ["slime", "enemies"],
          file_type: "png"
        },
        {
          id: "fallback-tile",
          name: "Grass",
          url: `${this.baseUrl}platformer/sprites/tiles/grass.png`,
          category: "sprites",
          subcategory: "tiles",
          tags: ["grass", "tiles"],
          file_type: "png"
        },
        {
          id: "fallback-coin",
          name: "Coin Gold",
          url: `${this.baseUrl}platformer/sprites/tiles/coin_gold.png`,
          category: "sprites",
          subcategory: "tiles",
          tags: ["tiles"],
          file_type: "png"
        }
      ],
      search_index: {}
    };
  }

  /**
   * Search for assets based on criteria
   */
  async searchAssets(criteria: AssetSearchCriteria = {}): Promise<GameAsset[]> {
    const manifest = await this.loadManifest();
    if (!manifest) return [];

    let results = manifest.assets;

    // Filter by category
    if (criteria.category) {
      results = results.filter(asset => 
        asset.category?.toLowerCase() === criteria.category!.toLowerCase()
      );
    }

    // Filter by subcategory
    if (criteria.subcategory) {
      results = results.filter(asset => 
        asset.subcategory?.toLowerCase() === criteria.subcategory!.toLowerCase()
      );
    }

    // Filter by tags (AND logic)
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(asset => {
        if (!asset.tags || asset.tags.length === 0) return false;
        return criteria.tags!.every(tag => 
          asset.tags.some(assetTag => assetTag.toLowerCase() === tag.toLowerCase())
        );
      });
    }

    // Filter by name (partial match)
    if (criteria.name) {
      results = results.filter(asset => 
        asset.name.toLowerCase().includes(criteria.name!.toLowerCase())
      );
    }

    // Filter by file type
    if (criteria.file_type) {
      results = results.filter(asset => 
        asset.file_type?.toLowerCase() === criteria.file_type!.toLowerCase()
      );
    }

    // Apply limit
    if (criteria.limit && criteria.limit > 0) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  /**
   * Get a single asset URL by search criteria with fallback
   */
  async getAssetUrl(criteria: AssetSearchCriteria, fallbackUrl?: string): Promise<string | null> {
    const cacheKey = JSON.stringify(criteria);
    
    try {
      // Try to get from advanced cache if available
      try {
        const { multiLevelCache, cacheAnalytics } = await import('./advanced-cache');
        
        // Start timing for analytics
        const startTime = performance.now();
        
        // Try to get from multi-level cache
        const cachedUrl = await multiLevelCache.get<string>(cacheKey);
        
        if (cachedUrl) {
          // Record cache hit
          const loadTime = performance.now() - startTime;
          cacheAnalytics.recordHit(loadTime);
          return cachedUrl;
        }
        
        // Record cache miss
        cacheAnalytics.recordMiss();
      } catch (error) {
        // Advanced cache not available, fall back to simple cache
        if (this.cache.has(cacheKey)) {
          return this.cache.get(cacheKey)!;
        }
      }
      
      // Not in cache, perform search
      const assets = await this.searchAssets({ ...criteria, limit: 1 });
      const url = assets.length > 0 ? assets[0].url : fallbackUrl || null;
      
      if (url) {
        // Store in simple cache
        this.cache.set(cacheKey, url);
        
        // Store in advanced cache if available
        try {
          const { multiLevelCache } = await import('./advanced-cache');
          await multiLevelCache.set(cacheKey, url);
        } catch (error) {
          // Advanced cache not available, ignore
        }
      }
      
      return url;
    } catch (error) {
      // Handle error
      try {
        const { cacheAnalytics } = await import('./advanced-cache');
        cacheAnalytics.recordError();
      } catch {
        // Ignore if analytics not available
      }
      
      console.error('Error getting asset URL:', error);
      return fallbackUrl || null;
    }
  }

  /**
   * Get player character sprite URL
   */
  async getPlayerSprite(color: string = 'beige', animation: string = 'idle'): Promise<string | null> {
    return this.getAssetUrl({
      subcategory: 'characters',
      tags: [color, animation]
    });
  }

  /**
   * Get enemy sprite URL
   */
  async getEnemySprite(enemyType: string = 'slime'): Promise<string | null> {
    return this.getAssetUrl({
      subcategory: 'enemies',
      tags: [enemyType]
    });
  }

  /**
   * Get tile sprite URL
   */
  async getTileSprite(tileType: string = 'grass'): Promise<string | null> {
    return this.getAssetUrl({
      subcategory: 'tiles',
      tags: [tileType]
    });
  }

  /**
   * Get coin sprite URL
   */
  async getCoinSprite(): Promise<string | null> {
    return this.getAssetUrl({
      name: 'coin'
    });
  }

  /**
   * Get background sprite URL
   */
  async getBackgroundSprite(bgType: string = 'hills'): Promise<string | null> {
    return this.getAssetUrl({
      subcategory: 'backgrounds',
      name: bgType
    });
  }

  /**
   * Get multiple assets for a complete game setup
   */
  async getGameAssets(): Promise<Record<string, string>> {
    const [player, enemy, tile, coin, background] = await Promise.all([
      this.getPlayerSprite('beige', 'idle'),
      this.getEnemySprite('slime'),
      this.getTileSprite('grass'),
      this.getCoinSprite(),
      this.getBackgroundSprite('hills')
    ]);

    return {
      player: player || '',
      enemy: enemy || '',
      tile: tile || '',
      coin: coin || '',
      background: background || ''
    };
  }
}

// Create a singleton instance
export const assetLoader = new AssetLoader();