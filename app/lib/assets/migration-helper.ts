/**
 * Migration Helper for converting static asset loading to dynamic loading
 */

import { assetLoader } from './asset-loader';

interface AssetMapping {
  oldPath: string;
  newKey: string;
  searchCriteria: any;
}

/**
 * Common asset mappings from static paths to dynamic search criteria
 */
const ASSET_MAPPINGS: AssetMapping[] = [
  // Player assets
  {
    oldPath: '/sprites/player.svg',
    newKey: 'player',
    searchCriteria: { subcategory: 'characters', tags: ['beige', 'idle'] }
  },
  {
    oldPath: '/sprites/player.png',
    newKey: 'player',
    searchCriteria: { subcategory: 'characters', tags: ['beige', 'idle'] }
  },
  
  // Enemy assets
  {
    oldPath: '/sprites/enemy.svg',
    newKey: 'enemy',
    searchCriteria: { subcategory: 'enemies', tags: ['slime'] }
  },
  {
    oldPath: '/sprites/enemy.png',
    newKey: 'enemy',
    searchCriteria: { subcategory: 'enemies', tags: ['slime'] }
  },
  
  // Coin assets
  {
    oldPath: '/sprites/coin.svg',
    newKey: 'coin',
    searchCriteria: { name: 'coin' }
  },
  {
    oldPath: '/sprites/coin.png',
    newKey: 'coin',
    searchCriteria: { name: 'coin' }
  },
  
  // Ground/tile assets
  {
    oldPath: '/tiles/ground.svg',
    newKey: 'ground',
    searchCriteria: { subcategory: 'tiles', tags: ['grass'] }
  },
  {
    oldPath: '/tiles/platform.svg',
    newKey: 'platform',
    searchCriteria: { subcategory: 'tiles', tags: ['grass'] }
  },
  
  // Background assets
  {
    oldPath: '/backgrounds/sky.svg',
    newKey: 'background',
    searchCriteria: { subcategory: 'backgrounds', name: 'hills' }
  }
];

/**
 * Migration helper class
 */
export class AssetMigrationHelper {
  private mappings: Map<string, AssetMapping> = new Map();

  constructor() {
    // Initialize mappings
    ASSET_MAPPINGS.forEach(mapping => {
      this.mappings.set(mapping.oldPath, mapping);
    });
  }
  
  /**
   * Get mapping for a specific static path
   */
  getMappingForPath(path: string): AssetMapping | undefined {
    return this.mappings.get(path);
  }

  /**
   * Convert static asset loading code to dynamic loading
   */
  async convertStaticToDynamic(staticAssetPaths: string[]): Promise<Record<string, string>> {
    const dynamicAssets: Record<string, string> = {};

    for (const path of staticAssetPaths) {
      const mapping = this.mappings.get(path);
      if (mapping) {
        const url = await assetLoader.getAssetUrl(mapping.searchCriteria);
        if (url) {
          dynamicAssets[mapping.newKey] = url;
        }
      }
    }

    return dynamicAssets;
  }

  /**
   * Generate migration code for a given set of static assets
   */
  generateMigrationCode(staticAssetPaths: string[]): string {
    const imports = `import { loadPlatformerAssets, PhaserAssetHelper } from './lib/assets/phaser-helpers';`;
    
    const oldCode = staticAssetPaths.map(path => 
      `    this.load.image('${this.getKeyFromPath(path)}', '${path}');`
    ).join('\n');

    const newCode = `    // OPTION 1: Quick setup
    await loadPlatformerAssets(this);
    
    // OPTION 2: Manual setup
    // const helper = new PhaserAssetHelper(this);
    // await helper.loadBasicAssets();`;

    return `
// MIGRATION GUIDE
// Add this import at the top of your file:
${imports}

// OLD CODE (static loading):
/*
  preload() {
${oldCode}
  }
*/

// NEW CODE (dynamic loading):
  async preload() {
${newCode}
  }
`;
  }

  /**
   * Extract asset key from file path
   */
  private getKeyFromPath(path: string): string {
    const filename = path.split('/').pop() || '';
    return filename.split('.')[0];
  }

  /**
   * Analyze existing code and suggest migrations
   */
  analyzeCode(code: string): {
    staticAssets: string[];
    suggestions: string[];
    migrationCode: string;
  } {
    const staticAssets: string[] = [];
    const suggestions: string[] = [];

    // Find all this.load.image calls
    const loadImageRegex = /this\.load\.image\(['"`]([^'"`]+)['"`],\s*['"`]([^'"`]+)['"`]\)/g;
    let match;

    while ((match = loadImageRegex.exec(code)) !== null) {
      const [, key, path] = match;
      staticAssets.push(path);
      
      if (this.mappings.has(path)) {
        suggestions.push(`✅ Can migrate: ${key} (${path})`);
      } else {
        suggestions.push(`⚠️  Manual migration needed: ${key} (${path})`);
      }
    }

    const migrationCode = this.generateMigrationCode(staticAssets);

    return {
      staticAssets,
      suggestions,
      migrationCode
    };
  }

  /**
   * Add custom asset mapping
   */
  addMapping(oldPath: string, newKey: string, searchCriteria: any): void {
    this.mappings.set(oldPath, {
      oldPath,
      newKey,
      searchCriteria
    });
  }
}

// Export singleton instance
export const migrationHelper = new AssetMigrationHelper();

/**
 * Quick migration function for common patterns
 */
export async function quickMigrate(scene: any, assetType: 'platformer' | 'character' | 'enemy' = 'platformer'): Promise<void> {
  switch (assetType) {
    case 'platformer':
      const { loadPlatformerAssets } = await import('./phaser-helpers');
      await loadPlatformerAssets(scene);
      break;
    case 'character':
      const { loadCharacterGame } = await import('./phaser-helpers');
      await loadCharacterGame(scene);
      break;
    case 'enemy':
      const { loadEnemyGame } = await import('./phaser-helpers');
      await loadEnemyGame(scene);
      break;
  }
}