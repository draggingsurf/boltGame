/**
 * Enemy Gallery Demo
 * Showcases the variety of enemy sprites available through the dynamic asset system
 */

import { PhaserAssetHelper } from '../app/lib/assets/phaser-helpers.js';
import { assetLoader } from '../app/lib/assets/asset-loader.js';

class EnemyGalleryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EnemyGalleryScene' });
    this.enemies = [];
    this.enemyTypes = ['slime', 'bee', 'frog', 'mouse', 'fish', 'worm', 'fly', 'snail', 'ladybug', 'barnacle'];
    this.currentPage = 0;
    this.enemiesPerPage = 5;
  }

  async preload() {
    // Show loading text
    this.loadingText = this.add.text(400, 300, 'Loading enemy assets...', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // Load all enemy variants
    const helper = new PhaserAssetHelper(this);
    await helper.loadEnemyVariants();
    
    // Load additional enemy types
    for (const enemyType of this.enemyTypes) {
      const url = await assetLoader.getEnemySprite(enemyType);
      if (url) {
        this.load.image(`enemy-${enemyType}`, url);
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
    this.add.text(400, 50, 'Enemy Gallery', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(400, 90, 'Showcasing dynamic enemy assets from Supabase', {
      fontSize: '16px',
      fill: '#cccccc'
    }).setOrigin(0.5);
    
    // Add instructions
    this.add.text(400, 130, 'Press LEFT/RIGHT to navigate pages', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Create enemy display
    this.createEnemyDisplay();
    
    // Add controls
    this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    
    // Add page indicator
    this.pageText = this.add.text(400, 540, `Page ${this.currentPage + 1}/${Math.ceil(this.enemyTypes.length / this.enemiesPerPage)}`, {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Add navigation buttons
    this.prevButton = this.add.text(200, 540, '< Previous', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive();
    
    this.nextButton = this.add.text(600, 540, 'Next >', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setInteractive();
    
    // Add button interactions
    this.prevButton.on('pointerdown', () => this.previousPage());
    this.nextButton.on('pointerdown', () => this.nextPage());
    
    // Add hover effects
    this.prevButton.on('pointerover', () => this.prevButton.setBackgroundColor('#555555'));
    this.prevButton.on('pointerout', () => this.prevButton.setBackgroundColor('#333333'));
    this.nextButton.on('pointerover', () => this.nextButton.setBackgroundColor('#555555'));
    this.nextButton.on('pointerout', () => this.nextButton.setBackgroundColor('#333333'));
  }

  async createEnemyDisplay() {
    // Clear existing enemies
    this.enemies.forEach(enemy => enemy.destroy());
    this.enemies = [];
    
    // Calculate start and end indices for current page
    const startIndex = this.currentPage * this.enemiesPerPage;
    const endIndex = Math.min(startIndex + this.enemiesPerPage, this.enemyTypes.length);
    
    // Create enemy display for current page
    for (let i = startIndex; i < endIndex; i++) {
      const enemyType = this.enemyTypes[i];
      const x = 200 + ((i - startIndex) % 3) * 200;
      const y = 250 + Math.floor((i - startIndex) / 3) * 150;
      
      // Get enemy sprite URL
      const spriteUrl = await assetLoader.getEnemySprite(enemyType);
      
      if (spriteUrl) {
        // Create sprite
        const enemy = this.add.sprite(x, y, `enemy-${enemyType}`).setScale(2);
        
        // Add enemy type label
        const label = this.add.text(x, y + 50, enemyType, {
          fontSize: '16px',
          fill: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
        
        // Add to enemies array for cleanup
        this.enemies.push(enemy);
        this.enemies.push(label);
        
        // Add animation
        this.tweens.add({
          targets: enemy,
          y: y - 10,
          duration: 1000 + Math.random() * 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
    
    // Update page indicator
    this.pageText.setText(`Page ${this.currentPage + 1}/${Math.ceil(this.enemyTypes.length / this.enemiesPerPage)}`);
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.createEnemyDisplay();
    }
  }

  nextPage() {
    if ((this.currentPage + 1) * this.enemiesPerPage < this.enemyTypes.length) {
      this.currentPage++;
      this.createEnemyDisplay();
    }
  }

  update() {
    // Navigate pages with arrow keys
    if (Phaser.Input.Keyboard.JustDown(this.leftKey)) {
      this.previousPage();
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) {
      this.nextPage();
    }
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#222222',
  scene: EnemyGalleryScene
};

// Start the game
const game = new Phaser.Game(config);

console.log('🎮 Enemy Gallery Demo Started!');
console.log('✅ Showcasing dynamic enemy assets from Supabase');
console.log('🎯 Use LEFT/RIGHT arrows to navigate pages');