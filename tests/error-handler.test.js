/**
 * Unit tests for the Error Handler
 */

// Mock dependencies
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage
});

// Mock console methods
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Import the module under test
import { AssetErrorHandler, AssetErrorType, safeLoadAsset } from '../app/lib/assets/error-handler';

describe('AssetErrorHandler', () => {
  let errorHandler;
  
  beforeEach(() => {
    // Reset mocks
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
    console.log.mockReset();
    console.warn.mockReset();
    console.error.mockReset();
    
    // Create a new instance for each test
    errorHandler = new AssetErrorHandler({
      logToConsole: true,
      useLocalStorage: true,
      maxErrorsStored: 5,
      autoRetry: true,
      maxRetries: 2,
      retryDelay: 100
    });
  });
  
  describe('handleError', () => {
    it('should log error to console', () => {
      const error = new Error('Test error');
      const assetInfo = { name: 'test-asset', category: 'test' };
      
      errorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        'Failed to load asset',
        error,
        assetInfo
      );
      
      expect(console.error).toHaveBeenCalled();
    });
    
    it('should store error in errors array', () => {
      const error = new Error('Test error');
      const assetInfo = { name: 'test-asset', category: 'test' };
      
      const errorDetails = errorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        'Failed to load asset',
        error,
        assetInfo
      );
      
      expect(errorHandler.getErrors().length).toBe(1);
      expect(errorHandler.getErrors()[0]).toBe(errorDetails);
    });
    
    it('should save errors to localStorage', () => {
      const error = new Error('Test error');
      const assetInfo = { name: 'test-asset', category: 'test' };
      
      errorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        'Failed to load asset',
        error,
        assetInfo
      );
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
    
    it('should enforce max errors limit', () => {
      // Add max + 1 errors
      for (let i = 0; i < 6; i++) {
        errorHandler.handleError(
          AssetErrorType.ASSET_LOAD_FAILED,
          `Error ${i}`,
          new Error(`Test error ${i}`),
          { name: `asset-${i}` }
        );
      }
      
      // Should only keep the most recent 5
      expect(errorHandler.getErrors().length).toBe(5);
      expect(errorHandler.getErrors()[0].message).toBe('Error 1');
    });
    
    it('should call custom error handler if provided', () => {
      const customHandler = jest.fn();
      const customErrorHandler = new AssetErrorHandler({
        onError: customHandler
      });
      
      customErrorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        'Failed to load asset',
        new Error('Test error'),
        { name: 'test-asset' }
      );
      
      expect(customHandler).toHaveBeenCalled();
    });
  });
  
  describe('retry functionality', () => {
    it('should allow retry if under max retries', () => {
      const assetId = 'test-asset';
      
      expect(errorHandler.canRetry(assetId)).toBe(true);
      
      errorHandler.incrementRetry(assetId);
      expect(errorHandler.canRetry(assetId)).toBe(true);
      
      errorHandler.incrementRetry(assetId);
      expect(errorHandler.canRetry(assetId)).toBe(false);
    });
    
    it('should increment retry count', () => {
      const assetId = 'test-asset';
      
      expect(errorHandler.incrementRetry(assetId)).toBe(1);
      expect(errorHandler.incrementRetry(assetId)).toBe(2);
      expect(errorHandler.incrementRetry(assetId)).toBe(3);
    });
    
    it('should reset retry count', () => {
      const assetId = 'test-asset';
      
      errorHandler.incrementRetry(assetId);
      errorHandler.incrementRetry(assetId);
      errorHandler.resetRetry(assetId);
      
      expect(errorHandler.canRetry(assetId)).toBe(true);
    });
    
    it('should calculate retry delay with exponential backoff', () => {
      expect(errorHandler.getRetryDelay(1)).toBe(100);
      expect(errorHandler.getRetryDelay(2)).toBe(200);
      expect(errorHandler.getRetryDelay(3)).toBe(400);
    });
  });
  
  describe('error management', () => {
    it('should get all errors', () => {
      errorHandler.handleError(AssetErrorType.ASSET_LOAD_FAILED, 'Error 1');
      errorHandler.handleError(AssetErrorType.NETWORK_ERROR, 'Error 2');
      
      const errors = errorHandler.getErrors();
      
      expect(errors.length).toBe(2);
      expect(errors[0].type).toBe(AssetErrorType.ASSET_LOAD_FAILED);
      expect(errors[1].type).toBe(AssetErrorType.NETWORK_ERROR);
    });
    
    it('should get errors for specific asset', () => {
      errorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        'Error 1',
        new Error('Test error 1'),
        { id: 'asset1' }
      );
      
      errorHandler.handleError(
        AssetErrorType.NETWORK_ERROR,
        'Error 2',
        new Error('Test error 2'),
        { id: 'asset2' }
      );
      
      const assetErrors = errorHandler.getErrorsForAsset('asset1');
      
      expect(assetErrors.length).toBe(1);
      expect(assetErrors[0].type).toBe(AssetErrorType.ASSET_LOAD_FAILED);
    });
    
    it('should clear all errors', () => {
      errorHandler.handleError(AssetErrorType.ASSET_LOAD_FAILED, 'Error 1');
      errorHandler.handleError(AssetErrorType.NETWORK_ERROR, 'Error 2');
      
      errorHandler.clearErrors();
      
      expect(errorHandler.getErrors().length).toBe(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
    
    it('should mark error as handled', () => {
      const errorDetails = errorHandler.handleError(
        AssetErrorType.ASSET_LOAD_FAILED,
        'Error 1'
      );
      
      errorHandler.markErrorHandled(errorDetails.timestamp);
      
      expect(errorHandler.getErrors()[0].handled).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
    
    it('should get error statistics', () => {
      errorHandler.handleError(AssetErrorType.ASSET_LOAD_FAILED, 'Error 1');
      errorHandler.handleError(AssetErrorType.NETWORK_ERROR, 'Error 2');
      errorHandler.handleError(AssetErrorType.TIMEOUT, 'Error 3');
      
      // Mark one error as handled
      errorHandler.markErrorHandled(errorHandler.getErrors()[0].timestamp);
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.total).toBe(3);
      expect(stats.handled).toBe(1);
      expect(stats.unhandled).toBe(2);
      expect(stats.byType[AssetErrorType.ASSET_LOAD_FAILED]).toBe(1);
      expect(stats.byType[AssetErrorType.NETWORK_ERROR]).toBe(1);
      expect(stats.byType[AssetErrorType.TIMEOUT]).toBe(1);
    });
  });
});

describe('safeLoadAsset', () => {
  beforeEach(() => {
    // Reset mocks
    console.error.mockReset();
  });
  
  it('should return result if load succeeds', async () => {
    const loadFn = jest.fn().mockResolvedValue('success');
    const assetInfo = { name: 'test-asset' };
    
    const result = await safeLoadAsset(loadFn, assetInfo);
    
    expect(result).toBe('success');
    expect(loadFn).toHaveBeenCalled();
  });
  
  it('should return null if load fails', async () => {
    const loadFn = jest.fn().mockRejectedValue(new Error('Load failed'));
    const assetInfo = { name: 'test-asset' };
    
    const result = await safeLoadAsset(loadFn, assetInfo);
    
    expect(result).toBeNull();
    expect(loadFn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
  
  it('should retry if load fails and retry is enabled', async () => {
    // Mock implementation that fails on first call but succeeds on second
    const loadFn = jest.fn()
      .mockRejectedValueOnce(new Error('Load failed'))
      .mockResolvedValueOnce('success');
    
    const assetInfo = { name: 'test-asset', id: 'test-id' };
    
    // Mock setTimeout to execute immediately
    jest.useFakeTimers();
    
    const resultPromise = safeLoadAsset(loadFn, assetInfo);
    
    // Fast-forward timers
    jest.runAllTimers();
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(loadFn).toHaveBeenCalledTimes(2);
    
    // Restore timers
    jest.useRealTimers();
  });
});