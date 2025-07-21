/**
 * Complete Platformer Game Example using Dynamic Asset Loading
 * This demonstrates the new asset loading patterns for BoltGame
 */

import { loadPlatformerAssets, PhaserAssetHelper } from '../app/lib/assets/phaser-helpers.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  async preload() {
    // OPTION 1: Quick setup with helper function
    await loadPlatformerAssets(this);
    
    // OPTION 2: Manual setup with more control
    // const helper = new PhaserAssetHelper(this);
    // await helper.loadBasicAssets();
    // await helper.loadCharacterAnimations('beige');
    // await helper.loadEnemyVariants();
  }

  create() {
    // Create game world using dynamically loaded assets
    this.createWorld();
    this.createPlayer();
    this.createEnemies();
    this.createCollectibles();
    this.setupPhysics();
    this.setupControls();
  }

  createWorld() {
    // Background
    this.add.image(400, 300, 'background').setScale(1);
    
    // Ground tiles
    this.platforms = this.physics.add.staticGroup();
    
    // Create ground
    for (let x = 0; x < 800; x += 64) {
      this.platforms.create(x + 32, 568, 'ground');
    }
    
    // Create platforms
    this.platforms.create(400, 400, 'ground');
    this.platforms.create(600, 300, 'ground');
    this.platforms.create(200, 300, 'ground');
  }

  createPlayer() {
    // Player sprite using dynamically loaded asset
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    
    // Player physics
    this.physics.add.collider(this.player, this.platforms);
  }

  createEnemies() {
    // Enemy group using dynamically loaded assets
    this.enemies = this.physics.add.group();
    
    // Spawn enemies
    const enemyPositions = [
      { x: 300, y: 450 },
      { x: 500, y: 450 },
      { x: 700, y: 450 }
    ];
    
    enemyPositions.forEach(pos => {
      const enemy = this.enemies.create(pos.x, pos.y, 'enemy');
      enemy.setBounce(1);
      enemy.setCollideWorldBounds(true);
      enemy.setVelocity(Phaser.Math.Between(-200, 200), 20);
    });
    
    this.physics.add.collider(this.enemies, this.platforms);
  }

  createCollectibles() {
    // Coins using dynamically loaded assets
    this.coins = this.physics.add.group({
      key: 'coin',
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 }
    });

    this.coins.children.entries.forEach(child => {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.physics.add.collider(this.coins, this.platforms);
  }

  setupPhysics() {
    // Player-coin collision
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    
    // Player-enemy collision
    this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
  }

  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    // Player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    
    // Update score
    this.score = (this.score || 0) + 10;
    
    // Check if all coins collected
    if (this.coins.countActive(true) === 0) {
      this.scene.restart();
    }
  }

  hitEnemy(player, enemy) {
    this.physics.pause();
    player.setTint(0xff0000);
    
    // Game over logic
    this.add.text(400, 300, 'Game Over!', {
      fontSize: '32px',
      fill: '#000'
    }).setOrigin(0.5);
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: GameScene
};

// Start the game
const game = new Phaser.Game(config);

console.log('🎮 Dynamic Platformer Game Started!');
console.log('✅ Assets loaded dynamically from Supabase');
console.log('🎯 Use arrow keys to move and jump');