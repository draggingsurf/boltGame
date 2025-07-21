/**
 * Error handling system for dynamic asset loading
 * Provides graceful degradation and comprehensive error reporting
 */

// Error types for asset loading
export enum AssetErrorType {
  MANIFEST_LOAD_FAILED = 'manifest_load_failed',
  ASSET_NOT_FOUND = 'asset_not_found',
  ASSET_LOAD_FAILED = 'asset_load_failed',
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  INVALID_ASSET = 'invalid_asset',
  UNKNOWN = 'unknown'
}

// Error details interface
export interface AssetErrorDetails {
  type: AssetErrorType;
  message: string;
  originalError?: Error;
  assetInfo?: {
    id?: string;
    name?: string;
    url?: string;
    category?: string;
    subcategory?: string;
  };
  timestamp: number;
  handled: boolean;
}

// Error handler configuration
export interface ErrorHandlerConfig {
  logToConsole: boolean;
  useLocalStorage: boolean;
  maxErrorsStored: number;
  autoRetry: boolean;
  maxRetries: number;
  retryDelay: number; // in ms
  onError?: (error: AssetErrorDetails) => void;
}

/**
 * Asset Error Handler class
 * Manages error handling, logging, and fallback strategies
 */
export class AssetErrorHandler {
  private errors: AssetErrorDetails[] = [];
  private config: ErrorHandlerConfig;
  
  /**
   * Get configuration
   */
  getConfig(): ErrorHandlerConfig {
    return { ...this.config };
  }
  private retryCount: Map<string, number> = new Map();
  private static instance: AssetErrorHandler;

  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = {
      logToConsole: true,
      useLocalStorage: true,
      maxErrorsStored: 50,
      autoRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };

    // Load errors from local storage if enabled
    if (this.config.useLocalStorage && typeof localStorage !== 'undefined') {
      try {
        const storedErrors = localStorage.getItem('boltGame_assetErrors');
        if (storedErrors) {
          this.errors = JSON.parse(storedErrors);
        }
      } catch (error) {
        console.warn('Failed to load asset errors from localStorage:', error);
      }
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<ErrorHandlerConfig>): AssetErrorHandler {
    if (!AssetErrorHandler.instance) {
      AssetErrorHandler.instance = new AssetErrorHandler(config);
    }
    return AssetErrorHandler.instance;
  }

  /**
   * Handle an asset loading error
   */
  public handleError(
    type: AssetErrorType,
    message: string,
    originalError?: Error,
    assetInfo?: AssetErrorDetails['assetInfo']
  ): AssetErrorDetails {
    const errorDetails: AssetErrorDetails = {
      type,
      message,
      originalError,
      assetInfo,
      timestamp: Date.now(),
      handled: false
    };

    // Log to console if enabled
    if (this.config.logToConsole) {
      console.error(`[Asset Error] ${type}: ${message}`, assetInfo, originalError);
    }

    // Store error
    this.errors.push(errorDetails);
    if (this.errors.length > this.config.maxErrorsStored) {
      this.errors.shift(); // Remove oldest error
    }

    // Save to local storage if enabled
    if (this.config.useLocalStorage && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('boltGame_assetErrors', JSON.stringify(this.errors));
      } catch (error) {
        console.warn('Failed to save asset errors to localStorage:', error);
      }
    }

    // Call custom error handler if provided
    if (this.config.onError) {
      this.config.onError(errorDetails);
    }

    return errorDetails;
  }

  /**
   * Check if retry is possible for a given asset
   */
  public canRetry(assetId: string): boolean {
    if (!this.config.autoRetry) return false;
    
    const retryCount = this.retryCount.get(assetId) || 0;
    return retryCount < this.config.maxRetries;
  }

  /**
   * Increment retry count for an asset
   */
  public incrementRetry(assetId: string): number {
    const currentCount = this.retryCount.get(assetId) || 0;
    const newCount = currentCount + 1;
    this.retryCount.set(assetId, newCount);
    return newCount;
  }

  /**
   * Reset retry count for an asset
   */
  public resetRetry(assetId: string): void {
    this.retryCount.delete(assetId);
  }

  /**
   * Get retry delay with exponential backoff
   */
  public getRetryDelay(retryCount: number): number {
    return this.config.retryDelay * Math.pow(2, retryCount - 1);
  }

  /**
   * Get all errors
   */
  public getErrors(): AssetErrorDetails[] {
    return [...this.errors];
  }

  /**
   * Get errors for a specific asset
   */
  public getErrorsForAsset(assetId: string): AssetErrorDetails[] {
    return this.errors.filter(error => error.assetInfo?.id === assetId);
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errors = [];
    this.retryCount.clear();
    
    if (this.config.useLocalStorage && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('boltGame_assetErrors');
      } catch (error) {
        console.warn('Failed to clear asset errors from localStorage:', error);
      }
    }
  }

  /**
   * Mark an error as handled
   */
  public markErrorHandled(errorId: number): void {
    const error = this.errors.find(e => e.timestamp === errorId);
    if (error) {
      error.handled = true;
      
      if (this.config.useLocalStorage && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('boltGame_assetErrors', JSON.stringify(this.errors));
        } catch (error) {
          console.warn('Failed to update asset errors in localStorage:', error);
        }
      }
    }
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    total: number;
    byType: Record<AssetErrorType, number>;
    handled: number;
    unhandled: number;
  } {
    const stats = {
      total: this.errors.length,
      byType: {} as Record<AssetErrorType, number>,
      handled: 0,
      unhandled: 0
    };

    // Initialize all error types with 0
    Object.values(AssetErrorType).forEach(type => {
      stats.byType[type] = 0;
    });

    // Count errors by type and handled status
    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      if (error.handled) {
        stats.handled++;
      } else {
        stats.unhandled++;
      }
    });

    return stats;
  }
}

// Export singleton instance
export const assetErrorHandler = AssetErrorHandler.getInstance();

/**
 * Utility function to safely load an asset with error handling and retries
 */
export async function safeLoadAsset<T>(
  loadFn: () => Promise<T>,
  assetInfo: AssetErrorDetails['assetInfo'],
  errorType: AssetErrorType = AssetErrorType.ASSET_LOAD_FAILED
): Promise<T | null> {
  try {
    return await loadFn();
  } catch (error) {
    const errorDetails = assetErrorHandler.handleError(
      errorType,
      error instanceof Error ? error.message : 'Unknown error loading asset',
      error instanceof Error ? error : undefined,
      assetInfo
    );

    // Attempt retry if enabled
    if (assetInfo?.id && assetErrorHandler.canRetry(assetInfo.id)) {
      const retryCount = assetErrorHandler.incrementRetry(assetInfo.id);
      const delay = assetErrorHandler.getRetryDelay(retryCount);
      
      console.log(`Retrying asset load (${retryCount}/${assetErrorHandler.getConfig().maxRetries}) after ${delay}ms: ${assetInfo.name || assetInfo.id}`);
      
      return new Promise(resolve => {
        setTimeout(async () => {
          try {
            const result = await loadFn();
            assetErrorHandler.resetRetry(assetInfo.id!);
            assetErrorHandler.markErrorHandled(errorDetails.timestamp);
            resolve(result);
          } catch (retryError) {
            resolve(null); // Give up after retry fails
          }
        }, delay);
      });
    }

    return null;
  }
}

// Note: getConfig method is already defined in the class