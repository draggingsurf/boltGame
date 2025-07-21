/**
 * Unit tests for the AssetLoader
 */

// Mock dependencies
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console methods
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Import the module under test
import { AssetLoader } from '../app/lib/assets/asset-loader';

describe('AssetLoader', () => {
  let assetLoader;
  
  // Sample manifest data
  const sampleManifest = {
    version: '1.0.0',
    generated_at: '2025-07-19T13:44:54.253Z',
    base_url: 'https://example.com/assets/',
    assets: [
      {
        id: 'asset1',
        name: 'Character Beige Idle',
        url: 'https://example.com/assets/characters/beige_idle.png',
        category: 'sprites',
        subcategory: 'characters',
        tags: ['beige', 'idle', 'characters'],
        file_type: 'png'
      },
      {
        id: 'asset2',
        name: 'Slime Enemy',
        url: 'https://example.com/assets/enemies/slime.png',
        category: 'sprites',
        subcategory: 'enemies',
        tags: ['slime', 'enemies'],
        file_type: 'png'
      },
      {
        id: 'asset3',
        name: 'Grass Tile',
        url: 'https://example.com/assets/tiles/grass.png',
        category: 'sprites',
        subcategory: 'tiles',
        tags: ['grass', 'tiles'],
        file_type: 'png'
      }
    ],
    search_index: {}
  };
  
  beforeEach(() => {
    // Reset mocks
    mockFetch.mockReset();
    console.log.mockReset();
    console.warn.mockReset();
    console.error.mockReset();
    
    // Create a new instance for each test
    assetLoader = new AssetLoader();
  });
  
  describe('loadManifest', () => {
    it('should load manifest successfully', async () => {
      // Mock successful fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleManifest
      });
      
      const manifest = await assetLoader.loadManifest();
      
      expect(manifest).toBeDefined();
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.assets.length).toBe(3);
      expect(mockFetch).toHaveBeenCalledWith('/game-asset-manifest.json');
    });
    
    it('should use fallback manifest if fetch fails', async () => {
      // Mock failed fetch
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const manifest = await assetLoader.loadManifest();
      
      expect(manifest).toBeDefined();
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.assets.length).toBeGreaterThan(0);
      expect(console.warn).toHaveBeenCalledWith('Could not load local manifest, using fallback');
    });
    
    it('should cache manifest after first load', async () => {
      // Mock successful fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => sampleManifest
      });
      
      // First load
      const manifest1 = await assetLoader.loadManifest();
      
      // Second load should use cached manifest
      const manifest2 = await assetLoader.loadManifest();
      
      expect(manifest1).toBe(manifest2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('searchAssets', () => {
    beforeEach(async () => {
      // Set up manifest
      assetLoader.manifest = sampleManifest;
    });
    
    it('should return all assets when no criteria provided', async () => {
      const assets = await assetLoader.searchAssets();
      
      expect(assets.length).toBe(3);
    });
    
    it('should filter by category', async () => {
      const assets = await assetLoader.searchAssets({ category: 'sprites' });
      
      expect(assets.length).toBe(3);
    });
    
    it('should filter by subcategory', async () => {
      const assets = await assetLoader.searchAssets({ subcategory: 'characters' });
      
      expect(assets.length).toBe(1);
      expect(assets[0].name).toBe('Character Beige Idle');
    });
    
    it('should filter by tags', async () => {
      const assets = await assetLoader.searchAssets({ tags: ['beige', 'idle'] });
      
      expect(assets.length).toBe(1);
      expect(assets[0].name).toBe('Character Beige Idle');
    });
    
    it('should filter by name', async () => {
      const assets = await assetLoader.searchAssets({ name: 'Slime' });
      
      expect(assets.length).toBe(1);
      expect(assets[0].name).toBe('Slime Enemy');
    });
    
    it('should filter by file_type', async () => {
      const assets = await assetLoader.searchAssets({ file_type: 'png' });
      
      expect(assets.length).toBe(3);
    });
    
    it('should apply limit', async () => {
      const assets = await assetLoader.searchAssets({ limit: 2 });
      
      expect(assets.length).toBe(2);
    });
    
    it('should combine multiple criteria', async () => {
      const assets = await assetLoader.searchAssets({
        category: 'sprites',
        subcategory: 'characters',
        tags: ['beige']
      });
      
      expect(assets.length).toBe(1);
      expect(assets[0].name).toBe('Character Beige Idle');
    });
    
    it('should return empty array if no matches', async () => {
      const assets = await assetLoader.searchAssets({
        subcategory: 'nonexistent'
      });
      
      expect(assets.length).toBe(0);
    });
  });
  
  describe('getAssetUrl', () => {
    beforeEach(async () => {
      // Set up manifest
      assetLoader.manifest = sampleManifest;
    });
    
    it('should return URL for matching asset', async () => {
      const url = await assetLoader.getAssetUrl({
        subcategory: 'characters',
        tags: ['beige', 'idle']
      });
      
      expect(url).toBe('https://example.com/assets/characters/beige_idle.png');
    });
    
    it('should return null if no matching asset', async () => {
      const url = await assetLoader.getAssetUrl({
        subcategory: 'nonexistent'
      });
      
      expect(url).toBeNull();
    });
    
    it('should use fallback URL if provided and no match', async () => {
      const fallbackUrl = '/sprites/player.svg';
      const url = await assetLoader.getAssetUrl(
        { subcategory: 'nonexistent' },
        fallbackUrl
      );
      
      expect(url).toBe(fallbackUrl);
    });
    
    it('should cache results', async () => {
      // First call
      const url1 = await assetLoader.getAssetUrl({
        subcategory: 'characters',
        tags: ['beige', 'idle']
      });
      
      // Mock searchAssets to verify it's not called again
      jest.spyOn(assetLoader, 'searchAssets').mockImplementation(() => {
        throw new Error('Should not be called');
      });
      
      // Second call with same criteria
      const url2 = await assetLoader.getAssetUrl({
        subcategory: 'characters',
        tags: ['beige', 'idle']
      });
      
      expect(url1).toBe(url2);
    });
  });
  
  describe('specialized asset getters', () => {
    beforeEach(async () => {
      // Set up manifest
      assetLoader.manifest = sampleManifest;
      
      // Mock getAssetUrl
      jest.spyOn(assetLoader, 'getAssetUrl').mockImplementation((criteria) => {
        if (criteria.subcategory === 'characters' && criteria.tags.includes('beige')) {
          return Promise.resolve('https://example.com/assets/characters/beige_idle.png');
        }
        if (criteria.subcategory === 'enemies' && criteria.tags.includes('slime')) {
          return Promise.resolve('https://example.com/assets/enemies/slime.png');
        }
        if (criteria.subcategory === 'tiles' && criteria.tags.includes('grass')) {
          return Promise.resolve('https://example.com/assets/tiles/grass.png');
        }
        if (criteria.name === 'coin') {
          return Promise.resolve('https://example.com/assets/tiles/coin.png');
        }
        if (criteria.subcategory === 'backgrounds' && criteria.name === 'hills') {
          return Promise.resolve('https://example.com/assets/backgrounds/hills.png');
        }
        return Promise.resolve(null);
      });
    });
    
    it('should get player sprite', async () => {
      const url = await assetLoader.getPlayerSprite('beige', 'idle');
      
      expect(url).toBe('https://example.com/assets/characters/beige_idle.png');
      expect(assetLoader.getAssetUrl).toHaveBeenCalledWith({
        subcategory: 'characters',
        tags: ['beige', 'idle']
      });
    });
    
    it('should get enemy sprite', async () => {
      const url = await assetLoader.getEnemySprite('slime');
      
      expect(url).toBe('https://example.com/assets/enemies/slime.png');
      expect(assetLoader.getAssetUrl).toHaveBeenCalledWith({
        subcategory: 'enemies',
        tags: ['slime']
      });
    });
    
    it('should get tile sprite', async () => {
      const url = await assetLoader.getTileSprite('grass');
      
      expect(url).toBe('https://example.com/assets/tiles/grass.png');
      expect(assetLoader.getAssetUrl).toHaveBeenCalledWith({
        subcategory: 'tiles',
        tags: ['grass']
      });
    });
    
    it('should get coin sprite', async () => {
      const url = await assetLoader.getCoinSprite();
      
      expect(url).toBe('https://example.com/assets/tiles/coin.png');
      expect(assetLoader.getAssetUrl).toHaveBeenCalledWith({
        name: 'coin'
      });
    });
    
    it('should get background sprite', async () => {
      const url = await assetLoader.getBackgroundSprite('hills');
      
      expect(url).toBe('https://example.com/assets/backgrounds/hills.png');
      expect(assetLoader.getAssetUrl).toHaveBeenCalledWith({
        subcategory: 'backgrounds',
        name: 'hills'
      });
    });
  });
  
  describe('getGameAssets', () => {
    beforeEach(async () => {
      // Mock specialized getters
      jest.spyOn(assetLoader, 'getPlayerSprite').mockResolvedValue('https://example.com/assets/characters/beige_idle.png');
      jest.spyOn(assetLoader, 'getEnemySprite').mockResolvedValue('https://example.com/assets/enemies/slime.png');
      jest.spyOn(assetLoader, 'getTileSprite').mockResolvedValue('https://example.com/assets/tiles/grass.png');
      jest.spyOn(assetLoader, 'getCoinSprite').mockResolvedValue('https://example.com/assets/tiles/coin.png');
      jest.spyOn(assetLoader, 'getBackgroundSprite').mockResolvedValue('https://example.com/assets/backgrounds/hills.png');
    });
    
    it('should get all game assets', async () => {
      const assets = await assetLoader.getGameAssets();
      
      expect(assets).toEqual({
        player: 'https://example.com/assets/characters/beige_idle.png',
        enemy: 'https://example.com/assets/enemies/slime.png',
        tile: 'https://example.com/assets/tiles/grass.png',
        coin: 'https://example.com/assets/tiles/coin.png',
        background: 'https://example.com/assets/backgrounds/hills.png'
      });
      
      expect(assetLoader.getPlayerSprite).toHaveBeenCalledWith('beige', 'idle');
      expect(assetLoader.getEnemySprite).toHaveBeenCalledWith('slime');
      expect(assetLoader.getTileSprite).toHaveBeenCalledWith('grass');
      expect(assetLoader.getCoinSprite).toHaveBeenCalled();
      expect(assetLoader.getBackgroundSprite).toHaveBeenCalledWith('hills');
    });
    
    it('should handle missing assets', async () => {
      // Mock one getter to return null
      assetLoader.getEnemySprite.mockResolvedValue(null);
      
      const assets = await assetLoader.getGameAssets();
      
      expect(assets.enemy).toBe('');
    });
  });
});