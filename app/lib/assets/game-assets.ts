export interface GameAsset {
  id: string;
  name: string;
  type: 'sprite' | 'background' | 'sound' | 'music' | 'texture' | 'animation' | 'ui' | 'font';
  category: string;
  url: string;
  description: string;
  tags: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  format: string;
  license: 'free' | 'cc0' | 'cc-by' | 'custom';
  source: string;
}

export interface AssetCollection {
  gameType: string;
  assets: {
    sprites: GameAsset[];
    backgrounds: GameAsset[];
    sounds: GameAsset[];
    music: GameAsset[];
    ui: GameAsset[];
    fonts: GameAsset[];
  };
}

// Comprehensive Game Asset Database
export const GAME_ASSETS_DATABASE: Record<string, AssetCollection> = {
  // PLATFORMER GAMES
  platformer: {
    gameType: 'platformer',
    assets: {
      sprites: [
        {
          id: 'player_knight',
          name: 'Knight Character',
          type: 'sprite',
          category: 'player',
          url: 'https://opengameart.org/sites/default/files/knight_0.png',
          description: 'Pixel art knight character with animations',
          tags: ['player', 'character', 'knight', 'medieval', 'hero'],
          dimensions: { width: 32, height: 32 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        },
        {
          id: 'enemy_goblin',
          name: 'Goblin Enemy',
          type: 'sprite',
          category: 'enemy',
          url: 'https://opengameart.org/sites/default/files/goblin.png',
          description: 'Small goblin enemy sprite',
          tags: ['enemy', 'goblin', 'monster', 'fantasy'],
          dimensions: { width: 24, height: 24 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        },
        {
          id: 'platform_stone',
          name: 'Stone Platform',
          type: 'sprite',
          category: 'platform',
          url: 'https://opengameart.org/sites/default/files/stone_platform.png',
          description: 'Stone platform tile for level building',
          tags: ['platform', 'stone', 'ground', 'tile'],
          dimensions: { width: 64, height: 32 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        },
        {
          id: 'collectible_coin',
          name: 'Golden Coin',
          type: 'sprite',
          category: 'collectible',
          url: 'https://opengameart.org/sites/default/files/coin_gold.png',
          description: 'Animated golden coin collectible',
          tags: ['coin', 'collectible', 'gold', 'treasure'],
          dimensions: { width: 16, height: 16 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      backgrounds: [
        {
          id: 'forest_bg',
          name: 'Forest Background',
          type: 'background',
          category: 'environment',
          url: 'https://opengameart.org/sites/default/files/forest_background.png',
          description: 'Layered forest background for parallax scrolling',
          tags: ['forest', 'trees', 'nature', 'parallax'],
          dimensions: { width: 1024, height: 512 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        },
        {
          id: 'cave_bg',
          name: 'Cave Background',
          type: 'background',
          category: 'environment',
          url: 'https://opengameart.org/sites/default/files/cave_background.png',
          description: 'Dark cave background with stalactites',
          tags: ['cave', 'underground', 'dark', 'stone'],
          dimensions: { width: 1024, height: 512 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      sounds: [
        {
          id: 'jump_sound',
          name: 'Jump Sound',
          type: 'sound',
          category: 'sfx',
          url: 'https://freesound.org/data/previews/316/316847_5123451-lq.mp3',
          description: 'Player jump sound effect',
          tags: ['jump', 'player', 'action'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        },
        {
          id: 'coin_collect',
          name: 'Coin Collection',
          type: 'sound',
          category: 'sfx',
          url: 'https://freesound.org/data/previews/316/316815_5123451-lq.mp3',
          description: 'Coin collection sound',
          tags: ['coin', 'collect', 'pickup', 'treasure'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        }
      ],
      music: [
        {
          id: 'adventure_theme',
          name: 'Adventure Theme',
          type: 'music',
          category: 'background',
          url: 'https://freesound.org/data/previews/387/387232_5123451-lq.mp3',
          description: 'Upbeat adventure background music',
          tags: ['adventure', 'upbeat', 'loop', 'heroic'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        }
      ],
      ui: [
        {
          id: 'health_heart',
          name: 'Health Heart',
          type: 'ui',
          category: 'hud',
          url: 'https://opengameart.org/sites/default/files/heart.png',
          description: 'Heart icon for health display',
          tags: ['health', 'heart', 'life', 'hud'],
          dimensions: { width: 16, height: 16 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      fonts: [
        {
          id: 'pixel_font',
          name: 'Pixel Perfect Font',
          type: 'font',
          category: 'display',
          url: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
          description: 'Retro pixel-style font',
          tags: ['pixel', 'retro', 'gaming', '8bit'],
          format: 'WOFF2',
          license: 'free',
          source: 'Google Fonts'
        }
      ]
    }
  },

  // SHOOTER GAMES
  shooter: {
    gameType: 'shooter',
    assets: {
      sprites: [
        {
          id: 'player_spaceship',
          name: 'Player Spaceship',
          type: 'sprite',
          category: 'player',
          url: 'https://opengameart.org/sites/default/files/spaceship_player.png',
          description: 'Blue player spaceship sprite',
          tags: ['spaceship', 'player', 'space', 'sci-fi'],
          dimensions: { width: 32, height: 48 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        },
        {
          id: 'enemy_ufo',
          name: 'Enemy UFO',
          type: 'sprite',
          category: 'enemy',
          url: 'https://opengameart.org/sites/default/files/ufo_enemy.png',
          description: 'Flying saucer enemy',
          tags: ['ufo', 'alien', 'enemy', 'space'],
          dimensions: { width: 32, height: 32 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        },
        {
          id: 'laser_bullet',
          name: 'Laser Projectile',
          type: 'sprite',
          category: 'projectile',
          url: 'https://opengameart.org/sites/default/files/laser_blue.png',
          description: 'Blue laser bullet sprite',
          tags: ['laser', 'bullet', 'projectile', 'weapon'],
          dimensions: { width: 8, height: 16 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      backgrounds: [
        {
          id: 'space_bg',
          name: 'Space Background',
          type: 'background',
          category: 'environment',
          url: 'https://opengameart.org/sites/default/files/space_background.png',
          description: 'Starfield space background',
          tags: ['space', 'stars', 'galaxy', 'cosmos'],
          dimensions: { width: 1024, height: 768 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      sounds: [
        {
          id: 'laser_shot',
          name: 'Laser Shot',
          type: 'sound',
          category: 'sfx',
          url: 'https://freesound.org/data/previews/322/322769_5123451-lq.mp3',
          description: 'Laser weapon firing sound',
          tags: ['laser', 'shoot', 'weapon', 'sci-fi'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        },
        {
          id: 'explosion',
          name: 'Explosion',
          type: 'sound',
          category: 'sfx',
          url: 'https://freesound.org/data/previews/322/322770_5123451-lq.mp3',
          description: 'Enemy destruction explosion',
          tags: ['explosion', 'destroy', 'boom', 'death'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        }
      ],
      music: [
        {
          id: 'space_battle',
          name: 'Space Battle Theme',
          type: 'music',
          category: 'background',
          url: 'https://freesound.org/data/previews/387/387234_5123451-lq.mp3',
          description: 'Intense space battle music',
          tags: ['battle', 'intense', 'space', 'action'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        }
      ],
      ui: [
        {
          id: 'crosshair',
          name: 'Targeting Crosshair',
          type: 'ui',
          category: 'hud',
          url: 'https://opengameart.org/sites/default/files/crosshair.png',
          description: 'Targeting crosshair for aiming',
          tags: ['crosshair', 'aim', 'target', 'weapon'],
          dimensions: { width: 32, height: 32 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      fonts: [
        {
          id: 'sci_fi_font',
          name: 'Sci-Fi Font',
          type: 'font',
          category: 'display',
          url: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap',
          description: 'Futuristic sci-fi font',
          tags: ['sci-fi', 'futuristic', 'tech', 'modern'],
          format: 'WOFF2',
          license: 'free',
          source: 'Google Fonts'
        }
      ]
    }
  },

  // PUZZLE GAMES
  puzzle: {
    gameType: 'puzzle',
    assets: {
      sprites: [
        {
          id: 'puzzle_piece',
          name: 'Puzzle Piece',
          type: 'sprite',
          category: 'game_object',
          url: 'https://opengameart.org/sites/default/files/puzzle_piece.png',
          description: 'Colorful puzzle piece sprite',
          tags: ['puzzle', 'piece', 'jigsaw', 'colorful'],
          dimensions: { width: 64, height: 64 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        },
        {
          id: 'gem_red',
          name: 'Red Gem',
          type: 'sprite',
          category: 'match_object',
          url: 'https://opengameart.org/sites/default/files/gem_red.png',
          description: 'Red gem for match-3 games',
          tags: ['gem', 'red', 'match3', 'jewel'],
          dimensions: { width: 32, height: 32 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        },
        {
          id: 'gem_blue',
          name: 'Blue Gem',
          type: 'sprite',
          category: 'match_object',
          url: 'https://opengameart.org/sites/default/files/gem_blue.png',
          description: 'Blue gem for match-3 games',
          tags: ['gem', 'blue', 'match3', 'jewel'],
          dimensions: { width: 32, height: 32 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      backgrounds: [
        {
          id: 'zen_bg',
          name: 'Zen Garden Background',
          type: 'background',
          category: 'environment',
          url: 'https://opengameart.org/sites/default/files/zen_garden.png',
          description: 'Calming zen garden background',
          tags: ['zen', 'calm', 'peaceful', 'garden'],
          dimensions: { width: 800, height: 600 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      sounds: [
        {
          id: 'puzzle_complete',
          name: 'Puzzle Success',
          type: 'sound',
          category: 'sfx',
          url: 'https://freesound.org/data/previews/316/316820_5123451-lq.mp3',
          description: 'Success sound for completed puzzles',
          tags: ['success', 'complete', 'win', 'puzzle'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        },
        {
          id: 'piece_place',
          name: 'Piece Placement',
          type: 'sound',
          category: 'sfx',
          url: 'https://freesound.org/data/previews/316/316818_5123451-lq.mp3',
          description: 'Sound when placing puzzle pieces',
          tags: ['place', 'click', 'piece', 'move'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        }
      ],
      music: [
        {
          id: 'ambient_puzzle',
          name: 'Ambient Puzzle Music',
          type: 'music',
          category: 'background',
          url: 'https://freesound.org/data/previews/387/387230_5123451-lq.mp3',
          description: 'Relaxing ambient music for puzzle solving',
          tags: ['ambient', 'relaxing', 'calm', 'focus'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        }
      ],
      ui: [
        {
          id: 'button_hint',
          name: 'Hint Button',
          type: 'ui',
          category: 'button',
          url: 'https://opengameart.org/sites/default/files/hint_button.png',
          description: 'Button for puzzle hints',
          tags: ['hint', 'help', 'button', 'assistance'],
          dimensions: { width: 48, height: 48 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      fonts: [
        {
          id: 'clean_font',
          name: 'Clean Sans Font',
          type: 'font',
          category: 'display',
          url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600&display=swap',
          description: 'Clean, readable sans-serif font',
          tags: ['clean', 'readable', 'modern', 'friendly'],
          format: 'WOFF2',
          license: 'free',
          source: 'Google Fonts'
        }
      ]
    }
  },

  // RACING GAMES
  racing: {
    gameType: 'racing',
    assets: {
      sprites: [
        {
          id: 'car_player',
          name: 'Player Racing Car',
          type: 'sprite',
          category: 'vehicle',
          url: 'https://opengameart.org/sites/default/files/racing_car_blue.png',
          description: 'Blue racing car top-down view',
          tags: ['car', 'racing', 'vehicle', 'player'],
          dimensions: { width: 32, height: 64 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        },
        {
          id: 'car_enemy',
          name: 'AI Racing Car',
          type: 'sprite',
          category: 'vehicle',
          url: 'https://opengameart.org/sites/default/files/racing_car_red.png',
          description: 'Red AI racing car',
          tags: ['car', 'racing', 'ai', 'opponent'],
          dimensions: { width: 32, height: 64 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      backgrounds: [
        {
          id: 'race_track',
          name: 'Race Track',
          type: 'background',
          category: 'environment',
          url: 'https://opengameart.org/sites/default/files/race_track.png',
          description: 'Asphalt race track background',
          tags: ['track', 'asphalt', 'road', 'racing'],
          dimensions: { width: 1024, height: 1024 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      sounds: [
        {
          id: 'engine_sound',
          name: 'Engine Revving',
          type: 'sound',
          category: 'sfx',
          url: 'https://freesound.org/data/previews/322/322775_5123451-lq.mp3',
          description: 'Car engine revving sound',
          tags: ['engine', 'car', 'motor', 'revving'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        }
      ],
      music: [
        {
          id: 'racing_music',
          name: 'High-Speed Racing',
          type: 'music',
          category: 'background',
          url: 'https://freesound.org/data/previews/387/387236_5123451-lq.mp3',
          description: 'Fast-paced racing background music',
          tags: ['racing', 'fast', 'adrenaline', 'speed'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        }
      ],
      ui: [
        {
          id: 'speedometer',
          name: 'Speedometer',
          type: 'ui',
          category: 'hud',
          url: 'https://opengameart.org/sites/default/files/speedometer.png',
          description: 'Speed gauge for racing games',
          tags: ['speed', 'gauge', 'meter', 'hud'],
          dimensions: { width: 64, height: 64 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      fonts: [
        {
          id: 'racing_font',
          name: 'Racing Display Font',
          type: 'font',
          category: 'display',
          url: 'https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;700&display=swap',
          description: 'Bold condensed font for racing games',
          tags: ['racing', 'bold', 'speed', 'display'],
          format: 'WOFF2',
          license: 'free',
          source: 'Google Fonts'
        }
      ]
    }
  },

  // ARCADE GAMES
  arcade: {
    gameType: 'arcade',
    assets: {
      sprites: [
        {
          id: 'paddle',
          name: 'Game Paddle',
          type: 'sprite',
          category: 'game_object',
          url: 'https://opengameart.org/sites/default/files/paddle.png',
          description: 'Classic game paddle for Pong-style games',
          tags: ['paddle', 'pong', 'classic', 'arcade'],
          dimensions: { width: 16, height: 64 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        },
        {
          id: 'ball',
          name: 'Game Ball',
          type: 'sprite',
          category: 'game_object',
          url: 'https://opengameart.org/sites/default/files/ball.png',
          description: 'Classic arcade game ball',
          tags: ['ball', 'pong', 'breakout', 'arcade'],
          dimensions: { width: 16, height: 16 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      backgrounds: [
        {
          id: 'neon_bg',
          name: 'Neon Grid Background',
          type: 'background',
          category: 'environment',
          url: 'https://opengameart.org/sites/default/files/neon_grid.png',
          description: 'Retro neon grid background',
          tags: ['neon', 'grid', 'retro', 'synthwave'],
          dimensions: { width: 800, height: 600 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      sounds: [
        {
          id: 'blip',
          name: 'Arcade Blip',
          type: 'sound',
          category: 'sfx',
          url: 'https://freesound.org/data/previews/316/316816_5123451-lq.mp3',
          description: 'Classic arcade blip sound',
          tags: ['blip', 'arcade', 'retro', 'classic'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        }
      ],
      music: [
        {
          id: 'chiptune',
          name: 'Chiptune Music',
          type: 'music',
          category: 'background',
          url: 'https://freesound.org/data/previews/387/387238_5123451-lq.mp3',
          description: '8-bit style chiptune music',
          tags: ['chiptune', '8bit', 'retro', 'electronic'],
          format: 'MP3',
          license: 'cc0',
          source: 'Freesound'
        }
      ],
      ui: [
        {
          id: 'score_display',
          name: 'Digital Score Display',
          type: 'ui',
          category: 'hud',
          url: 'https://opengameart.org/sites/default/files/digital_display.png',
          description: 'Digital score display panel',
          tags: ['score', 'digital', 'display', 'hud'],
          dimensions: { width: 128, height: 32 },
          format: 'PNG',
          license: 'cc0',
          source: 'OpenGameArt'
        }
      ],
      fonts: [
        {
          id: 'arcade_font',
          name: 'Arcade Classic Font',
          type: 'font',
          category: 'display',
          url: 'https://fonts.googleapis.com/css2?family=Bungee&display=swap',
          description: 'Bold arcade-style display font',
          tags: ['arcade', 'bold', 'display', 'retro'],
          format: 'WOFF2',
          license: 'free',
          source: 'Google Fonts'
        }
      ]
    }
  }
};

// Asset search and retrieval functions
export class GameAssetManager {
  static getAssetsForGameType(gameType: string): AssetCollection | null {
    const normalizedType = gameType.toLowerCase();
    return GAME_ASSETS_DATABASE[normalizedType] || null;
  }

  static searchAssets(query: string, gameType?: string): GameAsset[] {
    const results: GameAsset[] = [];
    const searchTerms = query.toLowerCase().split(' ');
    
    const collectionsToSearch = gameType 
      ? [GAME_ASSETS_DATABASE[gameType.toLowerCase()]]
      : Object.values(GAME_ASSETS_DATABASE);

    collectionsToSearch.forEach(collection => {
      if (!collection) return;
      
      Object.values(collection.assets).forEach(assetArray => {
        assetArray.forEach(asset => {
          const matchScore = this.calculateMatchScore(asset, searchTerms);
          if (matchScore > 0) {
            results.push({ ...asset, matchScore } as any);
          }
        });
      });
    });

    return results.sort((a: any, b: any) => b.matchScore - a.matchScore);
  }

  private static calculateMatchScore(asset: GameAsset, searchTerms: string[]): number {
    let score = 0;
    const searchableText = [
      asset.name,
      asset.description,
      asset.category,
      ...asset.tags
    ].join(' ').toLowerCase();

    searchTerms.forEach(term => {
      if (searchableText.includes(term)) {
        score += 1;
        // Bonus for exact tag matches
        if (asset.tags.some(tag => tag.toLowerCase() === term)) {
          score += 2;
        }
        // Bonus for name matches
        if (asset.name.toLowerCase().includes(term)) {
          score += 1;
        }
      }
    });

    return score;
  }

  static getAssetsByCategory(gameType: string, category: string): GameAsset[] {
    const collection = this.getAssetsForGameType(gameType);
    if (!collection) return [];

    const categoryMap: Record<string, string> = {
      'player': 'sprites',
      'enemy': 'sprites',
      'projectile': 'sprites',
      'platform': 'sprites',
      'collectible': 'sprites',
      'vehicle': 'sprites',
      'game_object': 'sprites',
      'match_object': 'sprites',
      'environment': 'backgrounds',
      'sfx': 'sounds',
      'background': 'music',
      'hud': 'ui',
      'button': 'ui',
      'display': 'fonts'
    };

    const assetType = categoryMap[category] || category;
    return (collection.assets as any)[assetType] || [];
  }

  static generateAssetCode(assets: GameAsset[], gameType: string): string {
    const assetsByType = {
      sprites: assets.filter(a => a.type === 'sprite'),
      backgrounds: assets.filter(a => a.type === 'background'),
      sounds: assets.filter(a => a.type === 'sound'),
      music: assets.filter(a => a.type === 'music'),
      ui: assets.filter(a => a.type === 'ui'),
      fonts: assets.filter(a => a.type === 'font')
    };

    return `
// Auto-generated assets for ${gameType} game
const gameAssets = {
  sprites: {
    ${assetsByType.sprites.map(asset => 
      `${asset.id}: {
        url: '${asset.url}',
        width: ${asset.dimensions?.width || 32},
        height: ${asset.dimensions?.height || 32},
        description: '${asset.description}'
      }`
    ).join(',\n    ')}
  },
  
  backgrounds: {
    ${assetsByType.backgrounds.map(asset => 
      `${asset.id}: {
        url: '${asset.url}',
        width: ${asset.dimensions?.width || 800},
        height: ${asset.dimensions?.height || 600},
        description: '${asset.description}'
      }`
    ).join(',\n    ')}
  },
  
  sounds: {
    ${assetsByType.sounds.map(asset => 
      `${asset.id}: {
        url: '${asset.url}',
        description: '${asset.description}'
      }`
    ).join(',\n    ')}
  },
  
  music: {
    ${assetsByType.music.map(asset => 
      `${asset.id}: {
        url: '${asset.url}',
        description: '${asset.description}'
      }`
    ).join(',\n    ')}
  },
  
  fonts: {
    ${assetsByType.fonts.map(asset => 
      `${asset.id}: {
        url: '${asset.url}',
        description: '${asset.description}'
      }`
    ).join(',\n    ')}
  }
};

// Asset loading helper functions
function loadImage(url, width = null, height = null) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (width && height) {
        img.width = width;
        img.height = height;
      }
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function loadSound(url) {
  const audio = new Audio(url);
  audio.preload = 'auto';
  return audio;
}

// Preload all assets
async function preloadGameAssets() {
  const loadPromises = [];
  
  // Load sprites
  Object.entries(gameAssets.sprites).forEach(([key, asset]) => {
    loadPromises.push(
      loadImage(asset.url, asset.width, asset.height)
        .then(img => gameAssets.sprites[key].image = img)
    );
  });
  
  // Load backgrounds
  Object.entries(gameAssets.backgrounds).forEach(([key, asset]) => {
    loadPromises.push(
      loadImage(asset.url, asset.width, asset.height)
        .then(img => gameAssets.backgrounds[key].image = img)
    );
  });
  
  // Load sounds
  Object.entries(gameAssets.sounds).forEach(([key, asset]) => {
    gameAssets.sounds[key].audio = loadSound(asset.url);
  });
  
  // Load music
  Object.entries(gameAssets.music).forEach(([key, asset]) => {
    const audio = loadSound(asset.url);
    audio.loop = true;
    gameAssets.music[key].audio = audio;
  });
  
  await Promise.all(loadPromises);
  console.log('All game assets loaded successfully!');
}`;
  }
} 