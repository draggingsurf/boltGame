/**
 * Terrain Variety Showcase
 * Demonstrates the variety of terrain tiles available through the dynamic asset system
 */

import { PhaserAssetHelper } from '../app/lib/assets/phaser-helpers.js';
import { assetLoader } from '../app/lib/assets/asset-loader.js';

class TerrainShowcaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TerrainShowcaseScene' });
    this.tiles = [];
    this.terrainTypes = ['grass', 'dirt', 'sand', 'stone', 'snow', 'purple'];
    this.specialTiles = ['coin', 'gem', 'key', 'block', 'switch', 'door', 'ladder', 'spike'];
    this.currentTerrainType = 'grass';
    this.terrainIndex = 0;
  }

  async preload() {
    // Show loading text
    this.loadingText = this.add.text(400, 300, 'Loading terrain assets...', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Load all terrain variants
    const helper = new PhaserAssetHelper(this);
    await helper.loadTerrainTiles();
    
    // Load additional special tiles
    for (const tileType of this.specialTiles) {
      const url = await assetLoader.getAssetUrl({
        subcategory: 'tiles',
        tags: [tileType]
      });
      
      if (url) {
        this.load.image(`tile-${tileType}`, url);
      }
    }
    
    // Remove loading text once loading is complete
    this.load.once('complete', () => {
      this.loadingText.destroy();
    });
    
    this.load.start();
  }

  create() {
    // Add title
    this.add.text(400, 50, 'Terrain Variety Showcase', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(400, 90, 'Demonstrating dynamic terrain assets from Supabase', {
      fontSize: '16px',
      fill: '#cccccc'
    }).setOrigin(0.5);
    
    // Add instructions
    this.add.text(400, 130, 'Press SPACE to change terrain type', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Create terrain display
    this.createTerrainDisplay();
    
    // Add controls
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Add terrain type text display
    this.terrainText = this.add.text(400, 540, `Terrain Type: ${this.currentTerrainType}`, {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Add change terrain button
    this.changeButton = this.add.text(400, 500, 'Change Terrain Type', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive();
    
    // Add button interactions
    this.changeButton.on('pointerdown', () => this.changeTerrainType());
    
    // Add hover effects
    this.changeButton.on('pointerover', () => this.changeButton.setBackgroundColor('#555555'));
    this.changeButton.on('pointerout', () => this.changeButton.setBackgroundColor('#333333'));
  }

  async createTerrainDisplay() {
    // Clear existing tiles
    this.tiles.forEach(tile => tile.destroy());
    this.tiles = [];
    
    // Create main terrain platform
    for (let x = 0; x < 800; x += 64) {
      const tile = this.add.sprite(x + 32, 350, `tile-${this.currentTerrainType}`);
      this.tiles.push(tile);
    }
    
    // Create terrain type label
    const label = this.add.text(400, 300, this.currentTerrainType.toUpperCase(), {
      fontSize: '24px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    this.tiles.push(label);
    
    // Add special tiles showcase
    const specialTilesY = 220;
    const specialTilesStartX = 150;
    const specialTilesSpacing = 70;
    
    // Add special tiles header
    const specialHeader = this.add.text(400, 180, 'Special Tiles', {
      fontSize: '20px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    this.tiles.push(specialHeader);
    
    // Add special tiles
    for (let i = 0; i < this.specialTiles.length; i++) {
      const tileType = this.specialTiles[i];
      const x = specialTilesStartX + i * specialTilesSpacing;
      
      // Create tile sprite
      if (this.textures.exists(`tile-${tileType}`)) {
        const tile = this.add.sprite(x, specialTilesY, `tile-${tileType}`);
        
        // Add tile label
        const tileLabel = this.add.text(x, specialTilesY + 40, tileType, {
          fontSize: '12px',
          fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.tiles.push(tile);
        this.tiles.push(tileLabel);
      }
    }
    
    // Update terrain type text
    this.terrainText.setText(`Terrain Type: ${this.currentTerrainType}`);
  }

  changeTerrainType() {
    this.terrainIndex = (this.terrainIndex + 1) % this.terrainTypes.length;
    this.currentTerrainType = this.terrainTypes[this.terrainIndex];
    this.createTerrainDisplay();
  }

  update() {
    // Change terrain type with space key
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.changeTerrainType();
    }
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#4488aa',
  scene: TerrainShowcaseScene
};

// Start the game
const game = new Phaser.Game(config);

console.log('🎮 Terrain Variety Showcase Started!');
console.log('✅ Demonstrating dynamic terrain assets from Supabase');
console.log('🎯 Press SPACE to change terrain type');