/**
 * GameTerminal AI Guidance for Dynamic Asset Loading
 * 
 * Provides intelligent asset loading recommendations, context-aware
 * asset suggestions, and troubleshooting guidance for the dynamic asset system.
 */

import { assetLoader } from './asset-loader';
import { AssetErrorType } from './error-handler';

/**
 * Game type for asset recommendations
 */
export enum GameType {
  PLATFORMER = 'platformer',
  ACTION = 'action',
  PUZZLE = 'puzzle',
  ADVENTURE = 'adventure',
  SHOOTER = 'shooter',
  RPG = 'rpg',
  RACING = 'racing',
  EDUCATIONAL = 'educational',
  OTHER = 'other'
}

/**
 * Game theme for asset recommendations
 */
export enum GameTheme {
  FANTASY = 'fantasy',
  SCI_FI = 'sci-fi',
  MODERN = 'modern',
  RETRO = 'retro',
  CARTOON = 'cartoon',
  REALISTIC = 'realistic',
  ABSTRACT = 'abstract',
  OTHER = 'other'
}

/**
 * Asset recommendation context
 */
export interface RecommendationContext {
  gameType: GameType;
  gameTheme?: GameTheme;
  playerCharacterType?: string;
  enemyTypes?: string[];
  terrainTypes?: string[];
  specialFeatures?: string[];
  colorScheme?: string[];
}

/**
 * Asset recommendation result
 */
export interface AssetRecommendation {
  playerCharacter: {
    color: string;
    animations: string[];
    description: string;
    searchCriteria: any;
  };
  enemies: Array<{
    type: string;
    description: string;
    searchCriteria: any;
  }>;
  terrain: Array<{
    type: string;
    description: string;
    searchCriteria: any;
  }>;
  backgrounds: Array<{
    type: string;
    description: string;
    searchCriteria: any;
  }>;
  specialItems: Array<{
    type: string;
    description: string;
    searchCriteria: any;
  }>;
  loadingCode: string;
}

/**
 * Common error patterns and solutions
 */
export interface ErrorSolution {
  errorType: AssetErrorType;
  symptom: string;
  cause: string;
  solution: string;
  codeExample: string;
}

/**
 * GameTerminal AI Guidance class
 */
export class AIGuidance {
  private static instance: AIGuidance;
  private assetCategories: Map<string, string[]> = new Map();
  private errorSolutions: ErrorSolution[] = [];
  
  constructor() {
    this.initializeAssetCategories();
    this.initializeErrorSolutions();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AIGuidance {
    if (!AIGuidance.instance) {
      AIGuidance.instance = new AIGuidance();
    }
    return AIGuidance.instance;
  }
  
  /**
   * Initialize asset categories for recommendations
   */
  private initializeAssetCategories(): void {
    // Character colors
    this.assetCategories.set('characterColors', ['beige', 'blue', 'green', 'pink', 'yellow']);
    
    // Character animations
    this.assetCategories.set('characterAnimations', ['idle', 'walk', 'jump', 'climb', 'duck', 'hit', 'front']);
    
    // Enemy types
    this.assetCategories.set('enemyTypes', ['slime', 'bee', 'frog', 'mouse', 'fish', 'worm', 'fly', 'snail', 'ladybug', 'barnacle']);
    
    // Terrain types
    this.assetCategories.set('terrainTypes', ['grass', 'dirt', 'sand', 'stone', 'snow', 'purple']);
    
    // Special items
    this.assetCategories.set('specialItems', ['coin', 'gem', 'key', 'block', 'switch', 'door', 'ladder', 'spike']);
    
    // Background types
    this.assetCategories.set('backgroundTypes', ['hills', 'desert', 'trees', 'mushrooms', 'clouds', 'solid']);
  }
  
  /**
   * Initialize error solutions
   */
  private initializeErrorSolutions(): void {
    this.errorSolutions = [
      {
        errorType: AssetErrorType.MANIFEST_LOAD_FAILED,
        symptom: "Assets don't load and console shows 'Manifest load failed'",
        cause: "The game-asset-manifest.json file couldn't be loaded",
        solution: "Ensure the manifest file is in the correct location or use fallback assets",
        codeExample: `
// Use fallback assets if manifest fails to load
try {
  await loadPlatformerAssets(this);
} catch (error) {
  console.error('Dynamic assets failed to load:', error);
  // Fallback to static assets
  this.load.image('player', '/sprites/player.svg');
  this.load.image('enemy', '/sprites/enemy.svg');
  this.load.image('ground', '/sprites/ground.svg');
}
`
      },
      {
        errorType: AssetErrorType.ASSET_NOT_FOUND,
        symptom: "Specific assets don't appear in the game",
        cause: "The requested asset couldn't be found in the manifest",
        solution: "Use more general search criteria or provide fallback assets",
        codeExample: `
// Provide fallback when getting assets
const playerUrl = await assetLoader.getPlayerSprite('beige', 'idle') || '/sprites/player.svg';
this.load.image('player', playerUrl);
`
      },
      {
        errorType: AssetErrorType.ASSET_LOAD_FAILED,
        symptom: "Assets are found but fail to load into the game",
        cause: "The asset URL is valid but the image couldn't be loaded",
        solution: "Use error handling and fallbacks in your loading code",
        codeExample: `
// Use the PhaserAssetHelper for automatic error handling
const helper = new PhaserAssetHelper(this);
await helper.loadBasicAssets();
`
      },
      {
        errorType: AssetErrorType.NETWORK_ERROR,
        symptom: "Assets fail to load with network errors in console",
        cause: "Network connectivity issues or CORS problems",
        solution: "Use the compatibility layer to automatically fall back to local assets",
        codeExample: `
// Use the compatibility layer
import { createCompatibilityLayer } from './lib/assets/compatibility-layer';
createCompatibilityLayer(this, { fallbackToStatic: true });
`
      }
    ];
  }
  
  /**
   * Get asset recommendations based on game context
   */
  async getAssetRecommendations(context: RecommendationContext): Promise<AssetRecommendation> {
    // Default player character based on game type
    let playerColor = 'beige';
    let playerAnimations = ['idle', 'walk', 'jump'];
    
    // Choose color based on theme or explicit choice
    if (context.colorScheme && context.colorScheme.length > 0) {
      const availableColors = this.assetCategories.get('characterColors') || [];
      const matchingColor = context.colorScheme.find(color => 
        availableColors.includes(color.toLowerCase())
      );
      if (matchingColor) {
        playerColor = matchingColor.toLowerCase();
      }
    } else if (context.gameTheme) {
      // Theme-based color selection
      switch (context.gameTheme) {
        case GameTheme.FANTASY:
          playerColor = 'green';
          break;
        case GameTheme.SCI_FI:
          playerColor = 'blue';
          break;
        case GameTheme.CARTOON:
          playerColor = 'yellow';
          break;
        case GameTheme.RETRO:
          playerColor = 'pink';
          break;
        default:
          playerColor = 'beige';
      }
    }
    
    // Choose enemy types based on game type
    const enemyTypes = context.enemyTypes || [];
    if (enemyTypes.length === 0) {
      switch (context.gameType) {
        case GameType.PLATFORMER:
          enemyTypes.push('slime', 'bee');
          break;
        case GameType.ACTION:
          enemyTypes.push('frog', 'ladybug');
          break;
        case GameType.ADVENTURE:
          enemyTypes.push('mouse', 'fish');
          break;
        default:
          enemyTypes.push('slime');
      }
    }
    
    // Choose terrain types based on game type and theme
    const terrainTypes = context.terrainTypes || [];
    if (terrainTypes.length === 0) {
      if (context.gameTheme === GameTheme.FANTASY) {
        terrainTypes.push('grass', 'stone');
      } else if (context.gameTheme === GameTheme.SCI_FI) {
        terrainTypes.push('stone', 'purple');
      } else if (context.gameTheme === GameTheme.RETRO) {
        terrainTypes.push('dirt', 'stone');
      } else {
        terrainTypes.push('grass');
      }
    }
    
    // Choose background based on theme
    const backgroundTypes = [];
    if (context.gameTheme === GameTheme.FANTASY) {
      backgroundTypes.push('trees', 'hills');
    } else if (context.gameTheme === GameTheme.SCI_FI) {
      backgroundTypes.push('solid', 'clouds');
    } else if (context.gameTheme === GameTheme.RETRO) {
      backgroundTypes.push('desert', 'solid');
    } else {
      backgroundTypes.push('hills');
    }
    
    // Choose special items based on game type
    const specialItems = [];
    switch (context.gameType) {
      case GameType.PLATFORMER:
        specialItems.push('coin', 'key');
        break;
      case GameType.PUZZLE:
        specialItems.push('switch', 'door', 'block');
        break;
      case GameType.ADVENTURE:
        specialItems.push('gem', 'key', 'ladder');
        break;
      default:
        specialItems.push('coin');
    }
    
    // Generate loading code based on recommendations
    let loadingCode = '';
    
    if (context.gameType === GameType.PLATFORMER) {
      loadingCode = `
// Load platformer assets with ${playerColor} character
import { loadPlatformerAssets, loadCharacterGame } from './lib/assets/phaser-helpers';

async preload() {
  // Option 1: Quick setup with all basic assets
  await loadPlatformerAssets(this);
  
  // Option 2: Character-focused game with specific color
  // await loadCharacterGame(this, '${playerColor}');
}`;
    } else {
      loadingCode = `
// Load custom assets for ${context.gameType} game with ${context.gameTheme || 'standard'} theme
import { PhaserAssetHelper } from './lib/assets/phaser-helpers';
import { assetLoader } from './lib/assets/asset-loader';

async preload() {
  const helper = new PhaserAssetHelper(this);
  
  // Load character assets
  await helper.loadCharacterAnimations('${playerColor}');
  
  // Load enemy assets
  ${enemyTypes.map(type => `const ${type}Url = await assetLoader.getEnemySprite('${type}');
  if (${type}Url) this.load.image('enemy-${type}', ${type}Url);`).join('\n  ')}
  
  // Load terrain assets
  ${terrainTypes.map(type => `const ${type}Url = await assetLoader.getTileSprite('${type}');
  if (${type}Url) this.load.image('tile-${type}', ${type}Url);`).join('\n  ')}
  
  // Load background
  const bgUrl = await assetLoader.getBackgroundSprite('${backgroundTypes[0]}');
  if (bgUrl) this.load.image('background', bgUrl);
}`;
    }
    
    // Return comprehensive recommendations
    return {
      playerCharacter: {
        color: playerColor,
        animations: playerAnimations,
        description: `${playerColor} character with ${playerAnimations.join(', ')} animations`,
        searchCriteria: { subcategory: 'characters', tags: [playerColor] }
      },
      enemies: enemyTypes.map(type => ({
        type,
        description: `${type} enemy`,
        searchCriteria: { subcategory: 'enemies', tags: [type] }
      })),
      terrain: terrainTypes.map(type => ({
        type,
        description: `${type} terrain`,
        searchCriteria: { subcategory: 'tiles', tags: [type] }
      })),
      backgrounds: backgroundTypes.map(type => ({
        type,
        description: `${type} background`,
        searchCriteria: { subcategory: 'backgrounds', name: type }
      })),
      specialItems: specialItems.map(type => ({
        type,
        description: `${type} item`,
        searchCriteria: { name: type }
      })),
      loadingCode
    };
  }
  
  /**
   * Get troubleshooting guidance for an error
   */
  getTroubleshootingGuidance(errorType: AssetErrorType): ErrorSolution | undefined {
    return this.errorSolutions.find(solution => solution.errorType === errorType);
  }
  
  /**
   * Get all troubleshooting guidance
   */
  getAllTroubleshootingGuidance(): ErrorSolution[] {
    return [...this.errorSolutions];
  }
  
  /**
   * Get context-aware asset suggestions based on existing code
   */
  async getContextAwareSuggestions(codeSnippet: string): Promise<{
    suggestions: string[];
    assetRecommendations: Record<string, any[]>;
    codeExamples: Record<string, string>;
  }> {
    const suggestions: string[] = [];
    const assetRecommendations: Record<string, any[]> = {};
    const codeExamples: Record<string, string> = {};
    
    // Check for platformer patterns
    if (codeSnippet.includes('platformer') || 
        (codeSnippet.includes('player') && codeSnippet.includes('jump'))) {
      suggestions.push('This appears to be a platformer game. Consider using loadPlatformerAssets() for quick setup.');
      
      // Recommend character variants
      const characterColors = this.assetCategories.get('characterColors') || [];
      assetRecommendations['characters'] = await Promise.all(
        characterColors.slice(0, 3).map(async color => {
          const url = await assetLoader.getPlayerSprite(color, 'idle');
          return { color, url };
        })
      );
      
      codeExamples['platformerSetup'] = `
// Quick platformer setup
import { loadPlatformerAssets } from './lib/assets/phaser-helpers';

async preload() {
  await loadPlatformerAssets(this);
}`;
    }
    
    // Check for enemy-heavy game patterns
    if (codeSnippet.includes('enemy') || codeSnippet.includes('enemies')) {
      suggestions.push('Your game uses enemies. Try loadEnemyGame() to access multiple enemy types.');
      
      // Recommend enemy variants
      const enemyTypes = this.assetCategories.get('enemyTypes') || [];
      assetRecommendations['enemies'] = await Promise.all(
        enemyTypes.slice(0, 3).map(async type => {
          const url = await assetLoader.getEnemySprite(type);
          return { type, url };
        })
      );
      
      codeExamples['enemySetup'] = `
// Load multiple enemy types
import { loadEnemyGame } from './lib/assets/phaser-helpers';

async preload() {
  await loadEnemyGame(this);
}`;
    }
    
    // Check for terrain-focused game patterns
    if (codeSnippet.includes('tile') || codeSnippet.includes('terrain') || 
        codeSnippet.includes('ground') || codeSnippet.includes('platform')) {
      suggestions.push('Your game uses terrain tiles. Try loadTerrainGame() to access multiple terrain types.');
      
      // Recommend terrain variants
      const terrainTypes = this.assetCategories.get('terrainTypes') || [];
      assetRecommendations['terrain'] = await Promise.all(
        terrainTypes.slice(0, 3).map(async type => {
          const url = await assetLoader.getTileSprite(type);
          return { type, url };
        })
      );
      
      codeExamples['terrainSetup'] = `
// Load multiple terrain types
import { loadTerrainGame } from './lib/assets/phaser-helpers';

async preload() {
  await loadTerrainGame(this);
}`;
    }
    
    // Check for static asset loading patterns
    if (codeSnippet.includes('this.load.image') && 
        (codeSnippet.includes('/sprites/') || codeSnippet.includes('/tiles/'))) {
      suggestions.push('You are using static asset loading. Consider migrating to dynamic asset loading for access to 1000+ professional assets.');
      
      codeExamples['migrationExample'] = `
// Migration from static to dynamic loading
import { migrationHelper } from './lib/assets/migration-helper';
import { createCompatibilityLayer } from './lib/assets/compatibility-layer';

// Option 1: Use compatibility layer for automatic migration
createCompatibilityLayer(this, { autoMigrate: true });

// Option 2: Analyze your code for migration suggestions
const analysis = migrationHelper.analyzeCode(yourCode);
console.log(analysis.suggestions);
console.log(analysis.migrationCode);`;
    }
    
    // If no specific patterns detected, provide general guidance
    if (suggestions.length === 0) {
      suggestions.push('Consider using dynamic asset loading to access 1000+ professional game assets.');
      
      codeExamples['generalSetup'] = `
// Basic dynamic asset loading setup
import { PhaserAssetHelper } from './lib/assets/phaser-helpers';

async preload() {
  const helper = new PhaserAssetHelper(this);
  await helper.loadBasicAssets();
}`;
    }
    
    return {
      suggestions,
      assetRecommendations,
      codeExamples
    };
  }
}

// Export singleton instance
export const aiGuidance = AIGuidance.getInstance();