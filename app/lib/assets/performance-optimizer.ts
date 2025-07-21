/**
 * Performance Optimizer for Dynamic Asset Loading
 * 
 * Provides optimization strategies for asset loading:
 * 1. Parallel Asset Loading: Load multiple assets simultaneously
 * 2. Lazy Loading: Load non-critical assets on demand
 * 3. Asset Prioritization: Load critical assets first
 * 4. Asset Bundling: Group related assets for efficient loading
 * 5. Progressive Loading: Show progress and load in stages
 */

import { assetLoader } from './asset-loader';
import { AssetErrorType, assetErrorHandler } from './error-handler';

/**
 * Asset priority levels
 */
export enum AssetPriority {
  CRITICAL = 'critical',   // Must be loaded before game starts
  HIGH = 'high',           // Should be loaded as soon as possible
  MEDIUM = 'medium',       // Can be loaded during gameplay
  LOW = 'low',             // Can be loaded when idle
  OPTIONAL = 'optional'    // Only load if explicitly requested
}

/**
 * Asset to be loaded with metadata
 */
export interface LoadableAsset {
  key: string;
  criteria: any;
  priority: AssetPriority;
  fallbackUrl?: string;
  loaded?: boolean;
  url?: string;
  error?: Error;
}

/**
 * Asset bundle for grouped loading
 */
export interface AssetBundle {
  name: string;
  assets: LoadableAsset[];
  priority: AssetPriority;
  progress?: number;
  loaded?: boolean;
}

/**
 * Loading progress callback
 */
export type ProgressCallback = (progress: number, loaded: number, total: number) => void;

/**
 * Asset loading configuration
 */
export interface LoadingConfig {
  maxConcurrent: number;
  retryFailed: boolean;
  maxRetries: number;
  timeout: number;
  progressCallback?: ProgressCallback;
  priorityOrder: boolean;
  abortOnError: boolean;
}

/**
 * Performance optimizer for asset loading
 */
export class PerformanceOptimizer {
  private config: LoadingConfig;
  private loadingQueue: LoadableAsset[] = [];
  private loadingBundles: AssetBundle[] = [];
  private activeLoads = 0;
  private abortController: AbortController | null = null;
  
  constructor(config?: Partial<LoadingConfig>) {
    this.config = {
      maxConcurrent: 6,
      retryFailed: true,
      maxRetries: 2,
      timeout: 10000,
      priorityOrder: true,
      abortOnError: false,
      ...config
    };
  }
  
  /**
   * Load multiple assets in parallel
   */
  async loadAssets(assets: LoadableAsset[]): Promise<Map<string, string>> {
    // Reset state
    this.loadingQueue = [...assets];
    this.activeLoads = 0;
    this.abortController = new AbortController();
    
    // Sort by priority if enabled
    if (this.config.priorityOrder) {
      this.sortByPriority();
    }
    
    // Create result map
    const results = new Map<string, string>();
    
    // Start loading
    const total = this.loadingQueue.length;
    let loaded = 0;
    
    // Process queue until empty or aborted
    const loadPromises: Promise<void>[] = [];
    
    while (this.loadingQueue.length > 0 && !this.abortController.signal.aborted) {
      // Check if we can start more loads
      if (this.activeLoads < this.config.maxConcurrent) {
        // Get next asset
        const asset = this.loadingQueue.shift();
        if (!asset) continue;
        
        // Increment active loads
        this.activeLoads++;
        
        // Load asset
        const loadPromise = this.loadAsset(asset).then(url => {
          // Decrement active loads
          this.activeLoads--;
          
          // Update progress
          if (url) {
            results.set(asset.key, url);
            loaded++;
            
            // Call progress callback
            if (this.config.progressCallback) {
              this.config.progressCallback(loaded / total, loaded, total);
            }
          }
        });
        
        loadPromises.push(loadPromise);
      } else {
        // Wait for a slot to open
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Wait for all loads to complete
    await Promise.all(loadPromises);
    
    return results;
  }
  
  /**
   * Load a single asset
   */
  private async loadAsset(asset: LoadableAsset, retryCount = 0): Promise<string | null> {
    try {
      // Check if aborted
      if (this.abortController?.signal.aborted) {
        return null;
      }
      
      // Create timeout promise
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout loading asset: ${asset.key}`)), this.config.timeout);
      });
      
      // Load asset with timeout
      const loadPromise = assetLoader.getAssetUrl(asset.criteria, asset.fallbackUrl);
      const url = await Promise.race([loadPromise, timeoutPromise]);
      
      if (url) {
        // Mark as loaded
        asset.loaded = true;
        asset.url = url;
        return url;
      }
      
      throw new Error(`Failed to load asset: ${asset.key}`);
    } catch (error) {
      // Handle error
      asset.error = error instanceof Error ? error : new Error(String(error));
      
      // Log error
      assetErrorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        `Failed to load asset: ${asset.key}`,
        asset.error,
        { name: asset.key }
      );
      
      // Retry if enabled
      if (this.config.retryFailed && retryCount < this.config.maxRetries) {
        console.log(`Retrying asset: ${asset.key} (${retryCount + 1}/${this.config.maxRetries})`);
        return this.loadAsset(asset, retryCount + 1);
      }
      
      // Abort if configured
      if (this.config.abortOnError) {
        this.abort();
      }
      
      return null;
    }
  }
  
  /**
   * Sort assets by priority
   */
  private sortByPriority(): void {
    const priorityValues = {
      [AssetPriority.CRITICAL]: 0,
      [AssetPriority.HIGH]: 1,
      [AssetPriority.MEDIUM]: 2,
      [AssetPriority.LOW]: 3,
      [AssetPriority.OPTIONAL]: 4
    };
    
    this.loadingQueue.sort((a, b) => {
      return priorityValues[a.priority] - priorityValues[b.priority];
    });
  }
  
  /**
   * Abort all loading
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
  
  /**
   * Create an asset bundle
   */
  createBundle(name: string, assets: LoadableAsset[], priority: AssetPriority = AssetPriority.MEDIUM): AssetBundle {
    const bundle: AssetBundle = {
      name,
      assets,
      priority,
      progress: 0,
      loaded: false
    };
    
    this.loadingBundles.push(bundle);
    return bundle;
  }
  
  /**
   * Load an asset bundle
   */
  async loadBundle(bundle: AssetBundle): Promise<Map<string, string>> {
    // Create progress callback for this bundle
    const bundleProgress: ProgressCallback = (progress, loaded, total) => {
      bundle.progress = progress;
      
      // Call main progress callback if provided
      if (this.config.progressCallback) {
        this.config.progressCallback(progress, loaded, total);
      }
    };
    
    // Create optimizer with bundle-specific config
    const optimizer = new PerformanceOptimizer({
      ...this.config,
      progressCallback: bundleProgress
    });
    
    // Load assets
    const results = await optimizer.loadAssets(bundle.assets);
    
    // Mark bundle as loaded
    bundle.loaded = true;
    bundle.progress = 1;
    
    return results;
  }
  
  /**
   * Load assets lazily (in the background)
   */
  loadLazy(assets: LoadableAsset[]): Promise<Map<string, string>> {
    // Create optimizer with minimal concurrency
    const optimizer = new PerformanceOptimizer({
      ...this.config,
      maxConcurrent: 2,
      priorityOrder: true
    });
    
    // Load assets in the background
    return optimizer.loadAssets(assets);
  }
  
  /**
   * Create a progressive loader for Phaser
   */
  createProgressiveLoader(scene: any, assets: LoadableAsset[]) {
    return {
      /**
       * Start progressive loading
       */
      async start(): Promise<Map<string, string>> {
        // Show loading UI
        const width = scene.cameras.main.width;
        const height = scene.cameras.main.height;
        
        // Create loading box
        const progressBox = scene.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
        
        // Create progress bar
        const progressBar = scene.add.graphics();
        
        // Create loading text
        const loadingText = scene.add.text(width / 2, height / 2 - 50, 'Loading assets...', {
          font: '18px Arial',
          fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Add progress percentage text
        const percentText = scene.add.text(width / 2, height / 2 + 40, '0%', {
          font: '18px Arial',
          fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Create optimizer with progress callback
        const optimizer = new PerformanceOptimizer({
          maxConcurrent: 4,
          retryFailed: true,
          maxRetries: 2,
          timeout: 10000,
          priorityOrder: true,
          progressCallback: (progress, loaded, total) => {
            // Update progress bar
            progressBar.clear();
            progressBar.fillStyle(0x9AD98D, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * progress, 30);
            percentText.setText(Math.round(progress * 100) + '%');
            
            // Update loading text
            loadingText.setText(`Loading assets... ${loaded}/${total}`);
          }
        });
        
        // Load assets
        const results = await optimizer.loadAssets(assets);
        
        // Clean up UI
        progressBar.destroy();
        progressBox.destroy();
        loadingText.destroy();
        percentText.destroy();
        
        return results;
      }
    };
  }
}

/**
 * Create a performance optimizer
 */
export function createPerformanceOptimizer(config?: Partial<LoadingConfig>): PerformanceOptimizer {
  return new PerformanceOptimizer(config);
}

/**
 * Load multiple assets in parallel
 */
export async function loadParallel(assets: LoadableAsset[], config?: Partial<LoadingConfig>): Promise<Map<string, string>> {
  const optimizer = new PerformanceOptimizer(config);
  return optimizer.loadAssets(assets);
}

/**
 * Load assets lazily (in the background)
 */
export async function loadLazy(assets: LoadableAsset[], config?: Partial<LoadingConfig>): Promise<Map<string, string>> {
  const optimizer = new PerformanceOptimizer({
    maxConcurrent: 2,
    priorityOrder: true,
    ...config
  });
  return optimizer.loadAssets(assets);
}

/**
 * Create a progressive loader for Phaser
 */
export function createProgressiveLoader(scene: any, assets: LoadableAsset[], config?: Partial<LoadingConfig>) {
  const optimizer = new PerformanceOptimizer(config);
  return optimizer.createProgressiveLoader(scene, assets);
}