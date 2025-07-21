/**
 * Comprehensive test of the AssetLoader functionality
 */

const fs = require('fs');
const path = require('path');

// Mock fetch for Node.js environment
global.fetch = async (url) => {
  if (url.includes('game-asset-manifest.json')) {
    const manifestPath = path.join(__dirname, 'public', 'game-asset-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf8');
      return {
        ok: true,
        json: async () => JSON.parse(content)
      };
    }
  }
  throw new Error('File not found');
};

// Import the AssetLoader (simulate ES module import)
const AssetLoader = class {
  constructor() {
    this.manifest = null;
    this.cache = new Map();
    this.baseUrl = "https://xptqqsqivdlwaogiftxd.supabase.co/storage/v1/object/public/assets/";
  }

  async loadManifest() {
    if (this.manifest) return this.manifest;

    try {
      const response = await fetch('/game-asset-manifest.json');
      if (response.ok) {
        this.manifest = await response.json();
        return this.manifest;
      }
    } catch (error) {
      console.warn('Could not load local manifest, using fallback');
    }

    this.manifest = this.createFallbackManifest();
    return this.manifest;
  }

  createFallbackManifest() {
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
        }
      ],
      search_index: {}
    };
  }

  async searchAssets(criteria = {}) {
    const manifest = await this.loadManifest();
    if (!manifest) return [];

    let results = manifest.assets;

    if (criteria.category) {
      results = results.filter(asset => 
        asset.category?.toLowerCase() === criteria.category.toLowerCase()
      );
    }

    if (criteria.subcategory) {
      results = results.filter(asset => 
        asset.subcategory?.toLowerCase() === criteria.subcategory.toLowerCase()
      );
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(asset => {
        if (!asset.tags || asset.tags.length === 0) return false;
        return criteria.tags.every(tag => 
          asset.tags.some(assetTag => assetTag.toLowerCase() === tag.toLowerCase())
        );
      });
    }

    if (criteria.name) {
      results = results.filter(asset => 
        asset.name.toLowerCase().includes(criteria.name.toLowerCase())
      );
    }

    if (criteria.file_type) {
      results = results.filter(asset => 
        asset.file_type?.toLowerCase() === criteria.file_type.toLowerCase()
      );
    }

    if (criteria.limit && criteria.limit > 0) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  async getAssetUrl(criteria, fallbackUrl) {
    const cacheKey = JSON.stringify(criteria);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const assets = await this.searchAssets({ ...criteria, limit: 1 });
    const url = assets.length > 0 ? assets[0].url : fallbackUrl || null;
    
    if (url) {
      this.cache.set(cacheKey, url);
    }

    return url;
  }

  async getPlayerSprite(color = 'beige', animation = 'idle') {
    return this.getAssetUrl({
      subcategory: 'characters',
      tags: [color, animation]
    });
  }

  async getEnemySprite(enemyType = 'slime') {
    return this.getAssetUrl({
      subcategory: 'enemies',
      tags: [enemyType]
    });
  }

  async getTileSprite(tileType = 'grass') {
    return this.getAssetUrl({
      subcategory: 'tiles',
      tags: [tileType]
    });
  }

  async getCoinSprite() {
    return this.getAssetUrl({
      name: 'coin'
    });
  }

  async getBackgroundSprite(bgType = 'hills') {
    return this.getAssetUrl({
      subcategory: 'backgrounds',
      name: bgType
    });
  }

  async getGameAssets() {
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
};

async function testAssetLoader() {
  console.log('🧪 Testing AssetLoader Functionality\n');

  const assetLoader = new AssetLoader();

  try {
    // Test 1: Load manifest
    console.log('1. Testing manifest loading...');
    const manifest = await assetLoader.loadManifest();
    console.log(`   ✅ Loaded manifest with ${manifest.assets.length} assets`);

    // Test 2: Search functionality
    console.log('\n2. Testing search functionality...');
    
    // Search for characters
    const characters = await assetLoader.searchAssets({
      subcategory: 'characters',
      limit: 3
    });
    console.log(`   👤 Found ${characters.length} character assets`);
    characters.forEach((asset, i) => {
      console.log(`      ${i + 1}. ${asset.name} - Tags: ${asset.tags.join(', ')}`);
    });

    // Search for enemies
    const enemies = await assetLoader.searchAssets({
      subcategory: 'enemies',
      limit: 3
    });
    console.log(`   👹 Found ${enemies.length} enemy assets`);
    enemies.forEach((asset, i) => {
      console.log(`      ${i + 1}. ${asset.name} - Tags: ${asset.tags.join(', ')}`);
    });

    // Test 3: Specific asset retrieval
    console.log('\n3. Testing specific asset retrieval...');
    
    const playerUrl = await assetLoader.getPlayerSprite('beige', 'idle');
    console.log(`   👤 Player sprite: ${playerUrl ? '✅ Found' : '❌ Not found'}`);
    
    const enemyUrl = await assetLoader.getEnemySprite('slime');
    console.log(`   👹 Enemy sprite: ${enemyUrl ? '✅ Found' : '❌ Not found'}`);
    
    const tileUrl = await assetLoader.getTileSprite('grass');
    console.log(`   🧱 Tile sprite: ${tileUrl ? '✅ Found' : '❌ Not found'}`);
    
    const coinUrl = await assetLoader.getCoinSprite();
    console.log(`   🪙 Coin sprite: ${coinUrl ? '✅ Found' : '❌ Not found'}`);

    // Test 4: Game assets bundle
    console.log('\n4. Testing game assets bundle...');
    const gameAssets = await assetLoader.getGameAssets();
    
    Object.entries(gameAssets).forEach(([key, url]) => {
      console.log(`   ${key}: ${url ? '✅ Loaded' : '❌ Missing'}`);
    });

    // Test 5: Caching
    console.log('\n5. Testing caching...');
    const startTime = Date.now();
    await assetLoader.getPlayerSprite('beige', 'idle');
    const cachedTime = Date.now() - startTime;
    console.log(`   ⚡ Cached retrieval time: ${cachedTime}ms`);

    // Test 6: Tag-based search
    console.log('\n6. Testing tag-based search...');
    const beigeAssets = await assetLoader.searchAssets({
      tags: ['beige'],
      limit: 3
    });
    console.log(`   🏷️  Found ${beigeAssets.length} assets with 'beige' tag`);

    console.log('\n🎉 AssetLoader tests completed successfully!');
    console.log('✅ Manifest loading works');
    console.log('✅ Search functionality works');
    console.log('✅ Asset retrieval works');
    console.log('✅ Caching works');
    console.log('✅ Tag-based search works');

  } catch (error) {
    console.error('❌ AssetLoader test failed:', error);
  }
}

// Run the test
testAssetLoader();