/**
 * Character Showcase Demo
 * Demonstrates the variety of character sprites available through the dynamic asset system
 */

import { PhaserAssetHelper } from '../app/lib/assets/phaser-helpers.js';
import { assetLoader } from '../app/lib/assets/asset-loader.js';

class CharacterShowcaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterShowcaseScene' });
    this.characters = [];
    this.currentColor = 'beige';
    this.colors = ['beige', 'blue', 'green', 'pink', 'yellow'];
    this.animations = ['idle', 'walk', 'jump', 'climb', 'duck'];
    this.colorIndex = 0;
    this.animationIndex = 0;
  }

  async preload() {
    // Show loading text
    this.loadingText = this.add.text(400, 300, 'Loading character assets...', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Load all character variants
    const helper = new PhaserAssetHelper(this);
    
    // Load all character colors
    for (const color of this.colors) {
      await helper.loadCharacterAnimations(color);
    }
    
    // Remove loading text
    this.loadingText.destroy();
  }

  create() {
    // Add title
    this.add.text(400, 50, 'Character Showcase', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(400, 90, 'Demonstrating dynamic character assets from Supabase', {
      fontSize: '16px',
      fill: '#cccccc'
    }).setOrigin(0.5);
    
    // Add instructions
    this.add.text(400, 130, 'Press SPACE to change character color', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(400, 160, 'Press ENTER to change animation type', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Create character display
    this.createCharacterDisplay();
    
    // Add controls
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    
    // Add color and animation text displays
    this.colorText = this.add.text(400, 500, `Color: ${this.currentColor}`, {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.animationText = this.add.text(400, 540, `Animation: ${this.animations[this.animationIndex]}`, {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
  }

  async createCharacterDisplay() {
    // Clear existing characters
    this.characters.forEach(character => character.destroy());
    this.characters = [];
    
    // Get current animation
    const animation = this.animations[this.animationIndex];
    
    // Create character display for each color
    for (let i = 0; i < this.colors.length; i++) {
      const color = this.colors[i];
      const x = 150 + i * 150;
      const y = 300;
      
      // Highlight current color
      const highlight = color === this.currentColor;
      
      // Get character sprite URL
      const spriteUrl = await assetLoader.getPlayerSprite(color, animation);
      
      if (spriteUrl) {
        // Load the sprite dynamically
        const key = `character-${color}-${animation}`;
        this.textures.exists(key) || this.load.image(key, spriteUrl);
        await new Promise(resolve => this.load.once('complete', resolve));
        
        // Create sprite
        const character = this.add.sprite(x, y, key).setScale(2);
        
        // Add highlight effect if this is the current color
        if (highlight) {
          const highlightCircle = this.add.circle(x, y, 50, 0xffff00, 0.3);
          this.characters.push(highlightCircle);
          
          // Add label
          const label = this.add.text(x, y + 80, color, {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
          }).setOrigin(0.5);
          this.characters.push(label);
        }
        
        this.characters.push(character);
      }
    }
  }

  update() {
    // Change character color
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.colorIndex = (this.colorIndex + 1) % this.colors.length;
      this.currentColor = this.colors[this.colorIndex];
      this.colorText.setText(`Color: ${this.currentColor}`);
      this.createCharacterDisplay();
    }
    
    // Change animation type
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.animationIndex = (this.animationIndex + 1) % this.animations.length;
      this.animationText.setText(`Animation: ${this.animations[this.animationIndex]}`);
      this.createCharacterDisplay();
    }
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: CharacterShowcaseScene
};

// Start the game
const game = new Phaser.Game(config);

console.log('🎮 Character Showcase Demo Started!');
console.log('✅ Demonstrating dynamic character assets from Supabase');
console.log('🎯 Press SPACE to change character color');
console.log('🎯 Press ENTER to change animation type');