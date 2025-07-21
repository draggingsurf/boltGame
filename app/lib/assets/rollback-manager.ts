/**
 * Rollback Manager for Dynamic Asset Loading
 * 
 * Provides mechanisms to safely roll back to static asset loading
 * if dynamic loading causes issues or incompatibilities.
 */

import { AssetErrorType, assetErrorHandler } from './error-handler';
import type { AssetErrorDetails } from './error-handler';

/**
 * Rollback configuration
 */
export interface RollbackConfig {
  autoRollbackThreshold: number;  // Number of errors before auto rollback
  persistRollbackState: boolean;  // Whether to save rollback state to localStorage
  monitorPerformance: boolean;    // Whether to monitor loading performance
  performanceThreshold: number;   // Loading time threshold in ms before suggesting rollback
}

/**
 * Rollback state
 */
export interface RollbackState {
  dynamicLoadingEnabled: boolean;
  errorCount: number;
  lastRollbackTime: number | null;
  performanceMetrics: {
    dynamicLoadingTimes: number[];
    staticLoadingTimes: number[];
  };
}

/**
 * Manages rollback to static asset loading when needed
 */
export class RollbackManager {
  private config: RollbackConfig;
  private state: RollbackState;
  private static instance: RollbackManager;

  constructor(config?: Partial<RollbackConfig>) {
    this.config = {
      autoRollbackThreshold: 5,
      persistRollbackState: true,
      monitorPerformance: true,
      performanceThreshold: 2000,
      ...config
    };

    // Initialize state
    this.state = this.loadState() || {
      dynamicLoadingEnabled: true,
      errorCount: 0,
      lastRollbackTime: null,
      performanceMetrics: {
        dynamicLoadingTimes: [],
        staticLoadingTimes: []
      }
    };

    // Subscribe to error events
    // We need to set the onError handler in the config
    const errorHandlerConfig = assetErrorHandler.getConfig();
    errorHandlerConfig.onError = (error: AssetErrorDetails) => this.handleAssetError(error);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<RollbackConfig>): RollbackManager {
    if (!RollbackManager.instance) {
      RollbackManager.instance = new RollbackManager(config);
    }
    return RollbackManager.instance;
  }

  /**
   * Handle asset loading error
   */
  private handleAssetError(error: any): void {
    // Increment error count
    this.state.errorCount++;
    
    // Check if we should auto-rollback
    if (this.state.dynamicLoadingEnabled && 
        this.state.errorCount >= this.config.autoRollbackThreshold) {
      console.warn(`⚠️ Asset loading error threshold reached (${this.state.errorCount}/${this.config.autoRollbackThreshold}). Rolling back to static assets.`);
      this.rollbackToDynamic(false);
    }
    
    // Save state
    this.saveState();
  }

  /**
   * Record loading performance
   */
  public recordLoadingTime(isDynamic: boolean, timeMs: number): void {
    if (!this.config.monitorPerformance) return;
    
    if (isDynamic) {
      this.state.performanceMetrics.dynamicLoadingTimes.push(timeMs);
      
      // Keep only the last 10 measurements
      if (this.state.performanceMetrics.dynamicLoadingTimes.length > 10) {
        this.state.performanceMetrics.dynamicLoadingTimes.shift();
      }
    } else {
      this.state.performanceMetrics.staticLoadingTimes.push(timeMs);
      
      // Keep only the last 10 measurements
      if (this.state.performanceMetrics.staticLoadingTimes.length > 10) {
        this.state.performanceMetrics.staticLoadingTimes.shift();
      }
    }
    
    // Check if dynamic loading is consistently slow
    this.checkPerformance();
    
    // Save state
    this.saveState();
  }

  /**
   * Check if dynamic loading performance is poor
   */
  private checkPerformance(): void {
    if (!this.config.monitorPerformance || 
        this.state.performanceMetrics.dynamicLoadingTimes.length < 5) {
      return;
    }
    
    // Calculate average dynamic loading time
    const avgDynamicTime = this.state.performanceMetrics.dynamicLoadingTimes.reduce(
      (sum, time) => sum + time, 0
    ) / this.state.performanceMetrics.dynamicLoadingTimes.length;
    
    // Check if static loading times are available for comparison
    if (this.state.performanceMetrics.staticLoadingTimes.length > 0) {
      const avgStaticTime = this.state.performanceMetrics.staticLoadingTimes.reduce(
        (sum, time) => sum + time, 0
      ) / this.state.performanceMetrics.staticLoadingTimes.length;
      
      // If dynamic loading is significantly slower than static
      if (avgDynamicTime > avgStaticTime * 2 && avgDynamicTime > this.config.performanceThreshold) {
        console.warn(`⚠️ Dynamic asset loading is significantly slower (${avgDynamicTime.toFixed(0)}ms vs ${avgStaticTime.toFixed(0)}ms). Consider rolling back to static assets.`);
      }
    } 
    // If no static times available, just check against threshold
    else if (avgDynamicTime > this.config.performanceThreshold) {
      console.warn(`⚠️ Dynamic asset loading is slow (${avgDynamicTime.toFixed(0)}ms). Consider rolling back to static assets if this affects gameplay.`);
    }
  }

  /**
   * Enable or disable dynamic loading
   */
  public rollbackToDynamic(enable: boolean): void {
    if (this.state.dynamicLoadingEnabled === enable) return;
    
    this.state.dynamicLoadingEnabled = enable;
    this.state.lastRollbackTime = Date.now();
    
    if (enable) {
      console.log('✅ Enabled dynamic asset loading');
    } else {
      console.log('⚠️ Rolled back to static asset loading');
      // Reset error count after rollback
      this.state.errorCount = 0;
    }
    
    // Save state
    this.saveState();
  }

  /**
   * Check if dynamic loading is enabled
   */
  public isDynamicLoadingEnabled(): boolean {
    return this.state.dynamicLoadingEnabled;
  }

  /**
   * Get rollback statistics
   */
  public getStats(): {
    dynamicLoadingEnabled: boolean;
    errorCount: number;
    lastRollbackTime: string | null;
    avgDynamicLoadingTime: number | null;
    avgStaticLoadingTime: number | null;
  } {
    // Calculate average loading times
    let avgDynamicLoadingTime = null;
    let avgStaticLoadingTime = null;
    
    if (this.state.performanceMetrics.dynamicLoadingTimes.length > 0) {
      avgDynamicLoadingTime = this.state.performanceMetrics.dynamicLoadingTimes.reduce(
        (sum, time) => sum + time, 0
      ) / this.state.performanceMetrics.dynamicLoadingTimes.length;
    }
    
    if (this.state.performanceMetrics.staticLoadingTimes.length > 0) {
      avgStaticLoadingTime = this.state.performanceMetrics.staticLoadingTimes.reduce(
        (sum, time) => sum + time, 0
      ) / this.state.performanceMetrics.staticLoadingTimes.length;
    }
    
    return {
      dynamicLoadingEnabled: this.state.dynamicLoadingEnabled,
      errorCount: this.state.errorCount,
      lastRollbackTime: this.state.lastRollbackTime ? new Date(this.state.lastRollbackTime).toLocaleString() : null,
      avgDynamicLoadingTime,
      avgStaticLoadingTime
    };
  }

  /**
   * Reset all statistics and state
   */
  public reset(): void {
    this.state = {
      dynamicLoadingEnabled: true,
      errorCount: 0,
      lastRollbackTime: null,
      performanceMetrics: {
        dynamicLoadingTimes: [],
        staticLoadingTimes: []
      }
    };
    
    // Save state
    this.saveState();
    
    console.log('✅ Rollback manager reset to default state');
  }

  /**
   * Save state to localStorage
   */
  private saveState(): void {
    if (!this.config.persistRollbackState || typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem('boltGame_rollbackState', JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save rollback state to localStorage:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadState(): RollbackState | null {
    if (!this.config.persistRollbackState || typeof localStorage === 'undefined') return null;
    
    try {
      const storedState = localStorage.getItem('boltGame_rollbackState');
      if (storedState) {
        return JSON.parse(storedState);
      }
    } catch (error) {
      console.warn('Failed to load rollback state from localStorage:', error);
    }
    
    return null;
  }
}

// Export singleton instance
export const rollbackManager = RollbackManager.getInstance();

/**
 * Utility function to measure asset loading time
 */
export async function measureLoadingTime<T>(
  loadFn: () => Promise<T>,
  isDynamic: boolean = true
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await loadFn();
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Record loading time
    rollbackManager.recordLoadingTime(isDynamic, loadTime);
    
    return result;
  } catch (error) {
    // Still record the time even if loading failed
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    rollbackManager.recordLoadingTime(isDynamic, loadTime);
    
    throw error;
  }
}