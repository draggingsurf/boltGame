/**
 * AI Guidance Demo
 * 
 * This example demonstrates the GameTerminal AI guidance features
 * for dynamic asset loading recommendations and troubleshooting.
 */

import { aiGuidance, GameType, GameTheme } from '../app/lib/assets/ai-guidance.js';
import { AssetErrorType } from '../app/lib/assets/error-handler.js';

class AIGuidanceDemoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AIGuidanceDemoScene' });
    this.currentGameType = GameType.PLATFORMER;
    this.currentGameTheme = GameTheme.FANTASY;
    this.recommendations = null;
    this.troubleshootingIndex = 0;
    this.troubleshootingGuidance = [];
  }

  preload() {
    // Load basic UI assets
    this.load.image('panel', '/sprites/panel.svg');
    this.load.image('button', '/sprites/button.svg');
  }

  async create() {
    // Add title
    this.add.text(400, 50, 'GameTerminal AI Guidance Demo', {
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    this.add.text(400, 90, 'Demonstrating intelligent asset recommendations and troubleshooting', {
      fontSize: '16px',
      fill: '#cccccc'
    }).setOrigin(0.5);
    
    // Add game type and theme selectors
    this.createGameTypeSelector();
    this.createGameThemeSelector();
    
    // Add get recommendations button
    this.addButton(400, 200, 'Get Asset Recommendations', async () => {
      await this.getRecommendations();
    });
    
    // Add troubleshooting button
    this.addButton(400, 250, 'Show Troubleshooting Guidance', () => {
      this.showTroubleshootingGuidance();
    });
    
    // Add code analysis button
    this.addButton(400, 300, 'Analyze Sample Code', async () => {
      await this.analyzeCode();
    });
    
    // Create results panel
    this.createResultsPanel();
    
    // Load troubleshooting guidance
    this.troubleshootingGuidance = aiGuidance.getAllTroubleshootingGuidance();
  }

  createGameTypeSelector() {
    this.add.text(200, 150, 'Game Type:', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);
    
    const gameTypes = Object.values(GameType);
    const dropdown = document.createElement('select');
    dropdown.style.position = 'absolute';
    dropdown.style.left = '300px';
    dropdown.style.top = '150px';
    dropdown.style.width = '150px';
    dropdown.style.height = '30px';
    
    gameTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.text = type.charAt(0).toUpperCase() + type.slice(1);
      dropdown.appendChild(option);
    });
    
    dropdown.value = this.currentGameType;
    dropdown.addEventListener('change', (e) => {
      this.currentGameType = e.target.value;
    });
    
    document.body.appendChild(dropdown);
    this.gameTypeDropdown = dropdown;
  }

  createGameThemeSelector() {
    this.add.text(500, 150, 'Game Theme:', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0, 0.5);
    
    const gameThemes = Object.values(GameTheme);
    const dropdown = document.createElement('select');
    dropdown.style.position = 'absolute';
    dropdown.style.left = '600px';
    dropdown.style.top = '150px';
    dropdown.style.width = '150px';
    dropdown.style.height = '30px';
    
    gameThemes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme;
      option.text = theme.charAt(0).toUpperCase() + theme.slice(1);
      dropdown.appendChild(option);
    });
    
    dropdown.value = this.currentGameTheme;
    dropdown.addEventListener('change', (e) => {
      this.currentGameTheme = e.target.value;
    });
    
    document.body.appendChild(dropdown);
    this.gameThemeDropdown = dropdown;
  }

  addButton(x, y, text, callback) {
    const button = this.add.text(x, y, text, {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive();
    
    button.on('pointerdown', callback);
    button.on('pointerover', () => button.setBackgroundColor('#555555'));
    button.on('pointerout', () => button.setBackgroundColor('#333333'));
    
    return button;
  }

  createResultsPanel() {
    // Create background panel
    const panel = this.add.rectangle(400, 450, 750, 300, 0x222222);
    
    // Add title
    this.resultsTitle = this.add.text(400, 350, 'AI Recommendations', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Add content text
    this.resultsText = this.add.text(50, 380, 'Click a button above to see AI recommendations, troubleshooting guidance, or code analysis.', {
      fontSize: '16px',
      fill: '#ffffff',
      wordWrap: { width: 700 }
    });
  }

  async getRecommendations() {
    this.resultsTitle.setText('Asset Recommendations');
    this.resultsText.setText('Loading recommendations...');
    
    try {
      // Get recommendations based on selected game type and theme
      this.recommendations = await aiGuidance.getAssetRecommendations({
        gameType: this.currentGameType,
        gameTheme: this.currentGameTheme
      });
      
      // Format recommendations as text
      const text = [
        `🎮 Recommendations for ${this.currentGameType} game with ${this.currentGameTheme} theme:`,
        '',
        `👤 Player Character: ${this.recommendations.playerCharacter.description}`,
        '',
        '👹 Recommended Enemies:',
        ...this.recommendations.enemies.map(enemy => `  • ${enemy.description}`),
        '',
        '🧱 Recommended Terrain:',
        ...this.recommendations.terrain.map(terrain => `  • ${terrain.description}`),
        '',
        '🌄 Recommended Backgrounds:',
        ...this.recommendations.backgrounds.map(bg => `  • ${bg.description}`),
        '',
        '🎁 Recommended Special Items:',
        ...this.recommendations.specialItems.map(item => `  • ${item.description}`),
        '',
        '📝 Recommended Loading Code:',
        this.recommendations.loadingCode
      ].join('\n');
      
      this.resultsText.setText(text);
    } catch (error) {
      this.resultsText.setText(`Error getting recommendations: ${error.message}`);
    }
  }

  showTroubleshootingGuidance() {
    this.resultsTitle.setText('Troubleshooting Guidance');
    
    // Get current guidance
    const guidance = this.troubleshootingGuidance[this.troubleshootingIndex];
    
    if (guidance) {
      const text = [
        `🔍 Troubleshooting for: ${guidance.errorType}`,
        '',
        `🚨 Symptom: ${guidance.symptom}`,
        `🔎 Cause: ${guidance.cause}`,
        `💡 Solution: ${guidance.solution}`,
        '',
        '📝 Code Example:',
        guidance.codeExample
      ].join('\n');
      
      this.resultsText.setText(text);
      
      // Increment index for next time
      this.troubleshootingIndex = (this.troubleshootingIndex + 1) % this.troubleshootingGuidance.length;
    } else {
      this.resultsText.setText('No troubleshooting guidance available.');
    }
  }

  async analyzeCode() {
    this.resultsTitle.setText('Code Analysis');
    this.resultsText.setText('Analyzing code...');
    
    // Sample code to analyze
    const sampleCode = `
class PlatformerGame extends Phaser.Scene {
  preload() {
    this.load.image('player', '/sprites/player.svg');
    this.load.image('enemy', '/sprites/enemy.svg');
    this.load.image('ground', '/sprites/ground.svg');
    this.load.image('coin', '/sprites/coin.svg');
  }
  
  create() {
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    
    this.enemies = this.physics.add.group();
    this.enemies.create(300, 450, 'enemy');
    
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
  }
  
  update() {
    // Player movement and jump logic
  }
}`;
    
    try {
      // Get context-aware suggestions
      const analysis = await aiGuidance.getContextAwareSuggestions(sampleCode);
      
      // Format suggestions as text
      const text = [
        '🔍 Code Analysis Results:',
        '',
        '💡 Suggestions:',
        ...analysis.suggestions.map(suggestion => `  • ${suggestion}`),
        '',
        '📝 Recommended Code Examples:',
        ...Object.entries(analysis.codeExamples).map(([key, code]) => `${key}:\n${code}`)
      ].join('\n');
      
      this.resultsText.setText(text);
    } catch (error) {
      this.resultsText.setText(`Error analyzing code: ${error.message}`);
    }
  }

  shutdown() {
    // Clean up DOM elements
    if (this.gameTypeDropdown) {
      document.body.removeChild(this.gameTypeDropdown);
    }
    if (this.gameThemeDropdown) {
      document.body.removeChild(this.gameThemeDropdown);
    }
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  scene: AIGuidanceDemoScene
};

// Start the game
const game = new Phaser.Game(config);

console.log('🎮 GameTerminal AI Guidance Demo Started!');
console.log('✅ Demonstrating intelligent asset recommendations and troubleshooting');
console.log('🎯 Try different game types and themes to see contextual recommendations');