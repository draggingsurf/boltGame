/**
 * Game Prompt Enhancer
 * Converts vague game ideas into structured, detailed prompts for game generation
 */

interface GamePromptInput {
  userInput: string;
  complexityLevel?: 'simple' | 'medium' | 'complex';
  preferredEngine?: 'phaser' | 'canvas' | 'kaboom';
}

interface GamePromptOutput {
  enhancedPrompt: string;
  estimatedComplexity: 'simple' | 'medium' | 'complex';
  suggestedChunking: boolean;
}

// Game genre detection patterns
const GENRE_PATTERNS = {
  platformer: ['mario', 'sonic', 'jump', 'platform', 'side-scroll', 'run'],
  shooter: ['shoot', 'bullet', 'space', 'alien', 'gun', 'laser', 'arcade'],
  puzzle: ['tetris', 'match', 'puzzle', 'block', 'solve', 'brain'],
  runner: ['temple run', 'subway', 'endless', 'runner', 'dodge'],
  rpg: ['rpg', 'quest', 'adventure', 'character', 'level up', 'story'],
  card: ['card', 'deck', 'poker', 'solitaire', 'blackjack'],
  racing: ['car', 'race', 'speed', 'track', 'drive'],
  fighting: ['fight', 'combat', 'battle', 'versus', 'punch', 'kick'],
};

// Complexity indicators
const COMPLEXITY_INDICATORS = {
  simple: ['simple', 'basic', 'easy', 'quick'],
  medium: ['levels', 'enemies', 'score', 'power-up', 'boss'],
  complex: ['multiplayer', 'ai', 'procedural', 'physics', 'complex', 'advanced', 'realistic'],
};

export function enhanceGamePrompt({ userInput, complexityLevel, preferredEngine }: GamePromptInput): GamePromptOutput {
  const normalizedInput = userInput.toLowerCase();

  // Detect game genre
  const detectedGenre = detectGenre(normalizedInput);

  // Determine complexity
  const estimatedComplexity = complexityLevel || detectComplexity(normalizedInput);

  // Determine if chunking is needed
  const suggestedChunking = estimatedComplexity === 'complex';

  // Generate enhanced prompt
  const enhancedPrompt = generateEnhancedPrompt({
    originalInput: userInput,
    genre: detectedGenre,
    complexity: estimatedComplexity,
    engine: preferredEngine || 'phaser',
  });

  return {
    enhancedPrompt,
    estimatedComplexity,
    suggestedChunking,
  };
}

function detectGenre(input: string): string {
  for (const [genre, keywords] of Object.entries(GENRE_PATTERNS)) {
    if (keywords.some((keyword) => input.includes(keyword))) {
      return genre;
    }
  }
  return 'arcade'; // default fallback
}

function detectComplexity(input: string): 'simple' | 'medium' | 'complex' {
  for (const [level, indicators] of Object.entries(COMPLEXITY_INDICATORS)) {
    if (indicators.some((indicator) => input.includes(indicator))) {
      return level as 'simple' | 'medium' | 'complex';
    }
  }
  return 'medium'; // default fallback
}

function generateEnhancedPrompt({
  originalInput,
  genre,
  complexity,
  engine,
}: {
  originalInput: string;
  genre: string;
  complexity: string;
  engine: string;
}): string {
  const templates = {
    platformer: generatePlatformerPrompt,
    shooter: generateShooterPrompt,
    puzzle: generatePuzzlePrompt,
    runner: generateRunnerPrompt,
    arcade: generateArcadePrompt,
  };

  const generator = templates[genre as keyof typeof templates] || templates.arcade;

  return generator({ originalInput, complexity, engine });
}

function generatePlatformerPrompt({ originalInput, complexity, engine }: any): string {
  const basePrompt = `# 🎮 Build a ${originalInput} - Enhanced Platformer Game

Create a complete side-scrolling platformer game using **${engine === 'phaser' ? 'Phaser 3' : 'Canvas API'}** that runs in Bolt.new.

## 🔧 Technical Requirements
- **Game Engine:** ${engine === 'phaser' ? 'Phaser 3 (npm version)' : 'Canvas API with requestAnimationFrame'}
- **Environment:** Bolt.new WebContainer
- **Sprite Library:** Use Phaser's built-in sprite library for all visual elements
- **No external assets:** Generate all textures using Phaser's built-in system

## 📂 Project Structure
\`\`\`
/src/
  main.js               # Game initialization
  ${complexity !== 'simple' ? 'scenes/\n    Level1.js\n    Level2.js\n    GameOver.js' : ''}
  ${complexity === 'complex' ? 'objects/\n    Player.js\n    Enemy.js\n  utils/\n    Physics.js' : ''}
\`\`\`

## 🎮 Game Mechanics
### Player Character
- **Movement:** Arrow keys (←→) or WASD
- **Actions:** Spacebar to jump
- **Physics:** Gravity, ground collision, platform detection
- **Start Position:** x=100, y=300

### Level Design
${complexity === 'simple' ? '- Single level with platforms and gaps' : ''}
${complexity === 'medium' ? '- 2-3 levels with increasing difficulty\n- Moving platforms and hazards' : ''}
${complexity === 'complex' ? '- 5+ levels with unique mechanics per level\n- Boss battles and power-ups\n- Secret areas and collectibles' : ''}

### Enemies & Obstacles
${complexity === 'simple' ? '- Static obstacles or simple patrolling enemies' : ''}
${complexity === 'medium' ? '- 2-3 enemy types with basic AI\n- Spikes, moving platforms, falling objects' : ''}
${complexity === 'complex' ? '- Multiple enemy types with advanced AI\n- Boss battles with multiple phases\n- Environmental hazards and traps' : ''}

### Collectibles & Scoring
- **Coins:** +10 points each, scattered throughout levels
- **Power-ups:** ${complexity === 'simple' ? 'None initially' : complexity === 'medium' ? 'Speed boost, extra jump' : 'Multiple power-ups, inventory system'}
- **Lives:** ${complexity === 'simple' ? '1 life (restart on death)' : '3 lives with respawn system'}

## 🎨 Graphics Creation
Use Phaser's built-in graphics methods to create all visual elements:

\`\`\`javascript
${
  engine === 'phaser'
    ? `// In create() function
// Generate textures in preload()
this.add.graphics().fillStyle(0xFFD700).fillRect(0, 0, 32, 32).generateTexture('player', 32, 32);
this.add.graphics().fillStyle(0xFF4444).fillRect(0, 0, 32, 32).generateTexture('enemy', 32, 32);
this.add.graphics().fillStyle(0xFFFF00).fillCircle(12, 12, 12).generateTexture('coin', 24, 24);
this.add.graphics().fillStyle(0x8B4513).fillRect(0, 0, 200, 32).generateTexture('platform', 200, 32);

// Create sprites in create()
this.player = this.add.sprite(x, y, 'player');
this.physics.add.existing(this.player);

this.enemy = this.add.sprite(x, y, 'enemy');
this.physics.add.existing(this.enemy);

this.coin = this.add.sprite(x, y, 'coin');
this.physics.add.existing(this.coin);

this.platform = this.add.sprite(x, y, 'platform');
this.physics.add.existing(this.platform, true);`
    : `// Canvas texture generation
// Generate player texture
ctx.fillStyle = '#FFD700';
ctx.fillRect(player.x, player.y, 32, 32);

// Draw platforms as brown rectangles
ctx.fillStyle = '#8B4513';
ctx.fillRect(platform.x, platform.y, 200, 32);`
}
\`\`\`

## 🎯 Win/Lose Conditions
- **Win:** ${complexity === 'simple' ? 'Reach the end flag' : complexity === 'medium' ? 'Complete all levels' : 'Defeat final boss and complete all levels'}
- **Lose:** Player falls off screen or touches enemy
- **Restart:** ${complexity === 'simple' ? 'Reload page' : 'Return to menu or restart level'}

## ⚡ Performance Requirements
- Target 60fps gameplay
- Smooth scrolling and animations
- Responsive controls (no input lag)
- Mobile-friendly touch controls

## 🎨 Visual Style
- Clean, readable pixel art style
- Consistent color palette
- Clear visual hierarchy (player, enemies, platforms)
- Smooth animations for character movement

## 📝 Implementation Notes
${
  engine === 'phaser'
    ? `- Use Phaser's Arcade Physics for collision detection
- Implement proper scene management for level transitions
- Use object pooling for bullets/particles if needed
- Follow Phaser best practices for asset loading and scene lifecycle`
    : `- Implement custom collision detection
- Use requestAnimationFrame for smooth animation
- Handle keyboard input with proper event listeners
- Manage game state with clean object structure`
}

## 🚀 Expected Output
Generate complete, working code files that:
1. Run immediately in Bolt.new after npm install
2. Use the specified asset paths
3. Implement all mentioned mechanics
4. Include proper error handling
5. Are well-commented and maintainable

${complexity === 'complex' ? '**Note:** Due to complexity, consider generating this in 2-3 chunks if the output becomes too large.' : ''}

Return all code files clearly labeled with markdown headers.`;

  return basePrompt;
}

function generateShooterPrompt({ originalInput, complexity, engine }: any): string {
  return `# 🚀 Build a ${originalInput} - Space Shooter Game

Create a top-down or side-scrolling shooter game using **${engine === 'phaser' ? 'Phaser 3' : 'Canvas API'}**.

## 🎮 Core Mechanics
- **Player Ship:** Move with arrow keys, shoot with spacebar
- **Enemies:** Spawn from edges, move toward player
- **Projectiles:** Player bullets and enemy bullets
- **Scoring:** Points for destroying enemies
- **Difficulty:** Increasing enemy spawn rate

## 🎨 Sprites
- Generate player ship texture and create sprite: this.add.graphics().fillRect(0,0,32,16).generateTexture('player',32,16); this.add.sprite(x, y, 'player')
- Generate enemy ship textures and create sprites: this.add.graphics().fillRect(0,0,24,16).generateTexture('enemy',24,16); this.add.sprite(x, y, 'enemy')
- Generate bullet textures and create sprites: this.add.graphics().fillCircle(3,3,3).generateTexture('bullet',6,6); this.add.sprite(x, y, 'bullet')

${complexity === 'complex' ? '## 🎯 Advanced Features\n- Multiple weapon types\n- Power-ups and upgrades\n- Boss battles with phases\n- Particle effects for explosions' : ''}

Generate complete working code with proper collision detection and game loop.`;
}

function generatePuzzlePrompt({ originalInput, complexity, engine }: any): string {
  return `# 🧩 Build a ${originalInput} - Puzzle Game

Create a grid-based puzzle game using **${engine === 'phaser' ? 'Phaser 3' : 'Canvas API'}**.

## 🎮 Core Mechanics
- **Grid System:** ${complexity === 'simple' ? '8x8' : complexity === 'medium' ? '10x10' : '12x12 with variable sizes'}
- **Input:** Mouse/touch to interact with pieces
- **Goal:** ${complexity === 'simple' ? 'Clear lines or match colors' : 'Complex pattern matching and cascading effects'}

Generate complete working puzzle logic with win/lose conditions.`;
}

function generateRunnerPrompt({ originalInput, complexity: _complexity, engine }: any): string {
  return `# 🏃 Build a ${originalInput} - Endless Runner Game

Create an auto-scrolling runner game using **${engine === 'phaser' ? 'Phaser 3' : 'Canvas API'}**.

## 🎮 Core Mechanics
- **Auto-movement:** Player moves forward automatically
- **Controls:** Jump, slide, or lane switching
- **Obstacles:** Static and moving hazards
- **Collectibles:** Coins and power-ups
- **Increasing Speed:** Game gets faster over time

Generate complete endless runner with obstacle generation.`;
}

function generateArcadePrompt({ originalInput, complexity: _complexity, engine }: any): string {
  return `# 🕹️ Build a ${originalInput} - Arcade Game

Create a classic arcade-style game using **${engine === 'phaser' ? 'Phaser 3' : 'Canvas API'}**.

## 🎮 Core Mechanics
- **Simple Controls:** Easy to learn, hard to master
- **Score System:** High score tracking
- **Increasing Difficulty:** Progressive challenge
- **Lives System:** Limited attempts

Generate complete arcade game with classic feel and modern implementation.`;
}

// Export for use in system prompts
export const PROMPT_ENHANCER_INSTRUCTIONS = `
AUTOMATIC PROMPT ENHANCEMENT:

When a user provides a vague game request (like "make a mario game" or "create flappy bird"), automatically enhance it using this process:

1. **Detect Genre:** Identify if it's a platformer, shooter, puzzle, runner, etc.
2. **Assess Complexity:** Simple (1-2 features), Medium (multiple levels/enemies), Complex (boss fights/advanced mechanics)
3. **Choose Engine:** Default to Phaser 3 for most games, Canvas for simple ones
4. **Structure Requirements:** Add technical specs, asset paths, and implementation details
5. **Generate Complete Prompt:** Output a detailed, structured prompt that includes:
   - Exact file structure
   - Graphics creation using Phaser's built-in system
   - Complete game mechanics description
   - Win/lose conditions
   - Technical constraints
   - Expected output format

**Always use Phaser's built-in graphics system instead of external assets.**

Example transformation:
User: "make a mario game"
→ Enhanced: [Full detailed prompt with Phaser 3 setup, platformer mechanics, sprite generation, level design, etc.]

This ensures every game request results in a complete, implementable specification.
`;
