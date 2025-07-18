import { GameAssetManager, GAME_ASSETS_DATABASE } from './game-assets';
import type { GameAsset } from './game-assets';

export interface GamePromptAnalysis {
  gameType: string;
  confidence: number;
  detectedElements: {
    player: string[];
    enemies: string[];
    environment: string[];
    mechanics: string[];
    style: string[];
  };
  suggestedAssets: GameAsset[];
  assetCode: string;
}

export class GameAssetAnalyzer {
  // Game type detection patterns
  private static gameTypePatterns = {
    platformer: [
      'platformer', 'platform', 'jump', 'mario', 'side scroller', 'side-scroll',
      'running', 'climbing', 'collectibles', 'coins', 'levels'
    ],
    shooter: [
      'shooter', 'shooting', 'space', 'alien', 'bullet', 'laser', 'weapon',
      'asteroids', 'galaga', 'shoot em up', 'shmup', 'top down shooter'
    ],
    puzzle: [
      'puzzle', 'match', 'tetris', 'block', 'sliding', 'jigsaw', 'brain',
      'logic', 'solve', 'think', 'match-3', 'connect', 'swap'
    ],
    racing: [
      'racing', 'car', 'drive', 'speed', 'track', 'lap', 'finish line',
      'vehicle', 'motor', 'road', 'highway', 'circuit'
    ],
    arcade: [
      'arcade', 'pong', 'breakout', 'snake', 'retro', 'classic',
      'simple', 'paddle', 'ball', 'brick', '8bit', 'pixel'
    ],
    rpg: [
      'rpg', 'role playing', 'character', 'stats', 'level up', 'quest',
      'adventure', 'story', 'dialogue', 'inventory', 'magic'
    ],
    strategy: [
      'strategy', 'tactical', 'turn based', 'chess', 'board', 'planning',
      'resource', 'management', 'units', 'command', 'war'
    ]
  };

  // Element detection patterns
  private static elementPatterns = {
    player: {
      knight: ['knight', 'warrior', 'sword', 'armor', 'medieval', 'hero'],
      spaceship: ['spaceship', 'ship', 'spacecraft', 'rocket', 'space'],
      car: ['car', 'vehicle', 'racing car', 'automobile'],
      character: ['character', 'player', 'avatar', 'protagonist']
    },
    enemies: {
      aliens: ['alien', 'ufo', 'extraterrestrial', 'invader'],
      monsters: ['monster', 'creature', 'beast', 'goblin', 'orc'],
      robots: ['robot', 'android', 'cyborg', 'machine', 'ai'],
      obstacles: ['obstacle', 'barrier', 'trap', 'hazard']
    },
    environment: {
      space: ['space', 'galaxy', 'stars', 'cosmos', 'universe'],
      forest: ['forest', 'woods', 'trees', 'nature', 'jungle'],
      cave: ['cave', 'underground', 'tunnel', 'mine', 'dark'],
      city: ['city', 'urban', 'buildings', 'streets', 'metropolis'],
      desert: ['desert', 'sand', 'dunes', 'hot', 'arid']
    },
    style: {
      pixel: ['pixel', 'retro', '8bit', '16bit', 'pixelated'],
      modern: ['modern', 'realistic', 'hd', 'detailed'],
      cartoon: ['cartoon', 'animated', 'colorful', 'fun'],
      dark: ['dark', 'gothic', 'horror', 'scary', 'grim']
    }
  };

  static analyzeGamePrompt(prompt: string): GamePromptAnalysis {
    const lowercasePrompt = prompt.toLowerCase();
    
    // Detect game type
    const gameTypeResult = this.detectGameType(lowercasePrompt);
    
    // Detect game elements
    const detectedElements = this.detectGameElements(lowercasePrompt);
    
    // Get suggested assets based on game type and elements
    const suggestedAssets = this.getSuggestedAssets(gameTypeResult.type, detectedElements, lowercasePrompt);
    
    // Generate asset code
    const assetCode = GameAssetManager.generateAssetCode(suggestedAssets, gameTypeResult.type);
    
    return {
      gameType: gameTypeResult.type,
      confidence: gameTypeResult.confidence,
      detectedElements,
      suggestedAssets,
      assetCode
    };
  }

  private static detectGameType(prompt: string): { type: string; confidence: number } {
    const scores: Record<string, number> = {};
    
    // Initialize scores
    Object.keys(this.gameTypePatterns).forEach(type => {
      scores[type] = 0;
    });
    
    // Calculate scores based on keyword matches
    Object.entries(this.gameTypePatterns).forEach(([type, keywords]) => {
      keywords.forEach(keyword => {
        if (prompt.includes(keyword)) {
          scores[type] += 1;
          
          // Bonus for exact phrase matches
          if (prompt.includes(` ${keyword} `) || prompt.startsWith(keyword) || prompt.endsWith(keyword)) {
            scores[type] += 0.5;
          }
        }
      });
    });
    
    // Find the highest scoring type
    const maxScore = Math.max(...Object.values(scores));
    const detectedType = Object.keys(scores).find(type => scores[type] === maxScore) || 'arcade';
    
    // Calculate confidence (0-1)
    const totalKeywords = Object.values(this.gameTypePatterns).flat().length;
    const confidence = Math.min(maxScore / 3, 1); // Cap at 1.0
    
    return {
      type: detectedType,
      confidence
    };
  }

  private static detectGameElements(prompt: string): GamePromptAnalysis['detectedElements'] {
    const elements: GamePromptAnalysis['detectedElements'] = {
      player: [],
      enemies: [],
      environment: [],
      mechanics: [],
      style: []
    };

    // Detect player elements
    Object.entries(this.elementPatterns.player).forEach(([element, keywords]) => {
      if (keywords.some(keyword => prompt.includes(keyword))) {
        elements.player.push(element);
      }
    });

    // Detect enemy elements
    Object.entries(this.elementPatterns.enemies).forEach(([element, keywords]) => {
      if (keywords.some(keyword => prompt.includes(keyword))) {
        elements.enemies.push(element);
      }
    });

    // Detect environment elements
    Object.entries(this.elementPatterns.environment).forEach(([element, keywords]) => {
      if (keywords.some(keyword => prompt.includes(keyword))) {
        elements.environment.push(element);
      }
    });

    // Detect style elements
    Object.entries(this.elementPatterns.style).forEach(([element, keywords]) => {
      if (keywords.some(keyword => prompt.includes(keyword))) {
        elements.style.push(element);
      }
    });

    // Detect mechanics (simplified)
    const mechanicsKeywords = {
      'jumping': ['jump', 'hop', 'leap'],
      'shooting': ['shoot', 'fire', 'bullet', 'weapon'],
      'collecting': ['collect', 'gather', 'pickup', 'coin'],
      'racing': ['race', 'speed', 'fast', 'lap'],
      'solving': ['solve', 'puzzle', 'think', 'brain']
    };

    Object.entries(mechanicsKeywords).forEach(([mechanic, keywords]) => {
      if (keywords.some(keyword => prompt.includes(keyword))) {
        elements.mechanics.push(mechanic);
      }
    });

    return elements;
  }

  private static getSuggestedAssets(gameType: string, elements: GamePromptAnalysis['detectedElements'], prompt: string): GameAsset[] {
    const assets: GameAsset[] = [];
    
    // Get base assets for the game type
    const gameAssets = GameAssetManager.getAssetsForGameType(gameType);
    if (!gameAssets) return assets;

    // Always include basic assets for the game type
    assets.push(...gameAssets.assets.sprites.slice(0, 3)); // Top 3 sprites
    assets.push(...gameAssets.assets.backgrounds.slice(0, 1)); // 1 background
    assets.push(...gameAssets.assets.sounds.slice(0, 2)); // 2 sounds
    assets.push(...gameAssets.assets.music.slice(0, 1)); // 1 music
    assets.push(...gameAssets.assets.ui.slice(0, 1)); // 1 UI element
    assets.push(...gameAssets.assets.fonts.slice(0, 1)); // 1 font

    // Add specific assets based on detected elements
    
    // Player-specific assets
    if (elements.player.includes('knight')) {
      const knightAssets = GameAssetManager.searchAssets('knight character', gameType);
      assets.push(...knightAssets.slice(0, 1));
    }
    
    if (elements.player.includes('spaceship')) {
      const spaceshipAssets = GameAssetManager.searchAssets('spaceship player', gameType);
      assets.push(...spaceshipAssets.slice(0, 1));
    }

    // Enemy-specific assets
    if (elements.enemies.includes('aliens')) {
      const alienAssets = GameAssetManager.searchAssets('alien ufo enemy', gameType);
      assets.push(...alienAssets.slice(0, 2));
    }

    if (elements.enemies.includes('monsters')) {
      const monsterAssets = GameAssetManager.searchAssets('monster goblin enemy', gameType);
      assets.push(...monsterAssets.slice(0, 2));
    }

    // Environment-specific assets
    if (elements.environment.includes('space')) {
      const spaceAssets = GameAssetManager.searchAssets('space stars background', gameType);
      assets.push(...spaceAssets.slice(0, 1));
    }

    if (elements.environment.includes('forest')) {
      const forestAssets = GameAssetManager.searchAssets('forest trees background', gameType);
      assets.push(...forestAssets.slice(0, 1));
    }

    // Mechanics-specific assets
    if (elements.mechanics.includes('collecting')) {
      const collectAssets = GameAssetManager.searchAssets('coin collectible treasure', gameType);
      assets.push(...collectAssets.slice(0, 1));
    }

    if (elements.mechanics.includes('shooting')) {
      const shootAssets = GameAssetManager.searchAssets('bullet laser projectile', gameType);
      assets.push(...shootAssets.slice(0, 1));
    }

    // Remove duplicates
    const uniqueAssets = assets.filter((asset, index, self) => 
      index === self.findIndex(a => a.id === asset.id)
    );

    return uniqueAssets;
  }

  // Generate analysis report for game development
  static generateAssetAnalysisReport(analysis: GamePromptAnalysis): string {
    return `
# 🎮 Game Asset Analysis Report

## Game Type Detection
- **Detected Type**: ${analysis.gameType.charAt(0).toUpperCase() + analysis.gameType.slice(1)}
- **Confidence**: ${(analysis.confidence * 100).toFixed(1)}%

## Detected Game Elements
${Object.entries(analysis.detectedElements).map(([category, elements]) => 
  elements.length > 0 ? `- **${category.charAt(0).toUpperCase() + category.slice(1)}**: ${elements.join(', ')}` : ''
).filter(line => line).join('\n')}

## Suggested Assets (${analysis.suggestedAssets.length} total)

### Sprites (${analysis.suggestedAssets.filter(a => a.type === 'sprite').length})
${analysis.suggestedAssets.filter(a => a.type === 'sprite').map(asset => 
  `- **${asset.name}**: ${asset.description} (${asset.dimensions?.width}x${asset.dimensions?.height})`
).join('\n')}

### Backgrounds (${analysis.suggestedAssets.filter(a => a.type === 'background').length})
${analysis.suggestedAssets.filter(a => a.type === 'background').map(asset => 
  `- **${asset.name}**: ${asset.description} (${asset.dimensions?.width}x${asset.dimensions?.height})`
).join('\n')}

### Audio (${analysis.suggestedAssets.filter(a => a.type === 'sound' || a.type === 'music').length})
${analysis.suggestedAssets.filter(a => a.type === 'sound' || a.type === 'music').map(asset => 
  `- **${asset.name}**: ${asset.description} (${asset.type})`
).join('\n')}

### UI & Fonts (${analysis.suggestedAssets.filter(a => a.type === 'ui' || a.type === 'font').length})
${analysis.suggestedAssets.filter(a => a.type === 'ui' || a.type === 'font').map(asset => 
  `- **${asset.name}**: ${asset.description} (${asset.type})`
).join('\n')}

## Asset Integration
All assets are royalty-free and ready to use. The generated asset code includes:
- Automatic asset loading and preloading
- Helper functions for image and audio loading
- Organized asset structure for easy access
- Error handling for failed asset loads

## License Information
- **CC0**: Public domain, no attribution required
- **Free**: Free to use with attribution
- All assets sourced from OpenGameArt.org and Freesound.org
`;
  }

  // Quick asset lookup for specific game elements
  static getAssetsForElements(gameType: string, elements: string[]): GameAsset[] {
    const searchQuery = elements.join(' ');
    return GameAssetManager.searchAssets(searchQuery, gameType);
  }

  // Check if a game prompt needs additional assets
  static needsMoreAssets(analysis: GamePromptAnalysis): boolean {
    const minimumAssets = {
      sprites: 2,
      backgrounds: 1,
      sounds: 1,
      music: 1
    };

    const assetCounts = {
      sprites: analysis.suggestedAssets.filter(a => a.type === 'sprite').length,
      backgrounds: analysis.suggestedAssets.filter(a => a.type === 'background').length,
      sounds: analysis.suggestedAssets.filter(a => a.type === 'sound').length,
      music: analysis.suggestedAssets.filter(a => a.type === 'music').length
    };

    return Object.entries(minimumAssets).some(([type, min]) => 
      assetCounts[type as keyof typeof assetCounts] < min
    );
  }
} 