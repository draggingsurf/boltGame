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
  fighting: ['fight', 'combat', 'battle', 'versus', 'punch', 'kick']
};

// Complexity indicators
const COMPLEXITY_INDICATORS = {
  simple: ['simple', 'basic', 'easy', 'quick'],
  medium: ['levels', 'enemies', 'score', 'power-up', 'boss'],
  complex: ['multiplayer', 'ai', 'procedural', 'physics', 'complex', 'advanced', 'realistic']
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
    engine: preferredEngine || 'phaser'
  });

  return {
    enhancedPrompt,
    estimatedComplexity,
    suggestedChunking
  };
}

function detectGenre(input: string): string {
  for (const [genre, keywords] of Object.entries(GENRE_PATTERNS)) {
    if (keywords.some(keyword => input.includes(keyword))) {
      return genre;
    }
  }
  return 'arcade'; // default fallback
}

function detectComplexity(input: string): 'simple' | 'medium' | 'complex' {
  for (const [level, indicators] of Object.entries(COMPLEXITY_INDICATORS)) {
    if (indicators.some(indicator => input.includes(indicator))) {
      return level as 'simple' | 'medium' | 'complex';
    }
  }
  return 'medium'; // default fallback
}

function generateEnhancedPrompt({
  originalInput,
  genre,
  complexity,
  engine
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
    arcade: generateArcadePrompt
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
- **Asset Handling:** Use pre-installed assets from \`/game-assets/\` directory
- **No base64:** Always reference assets via file paths

## 📂 Project Structure
\`\`\`
/public/game-assets/     # Pre-installed Kenney assets
  /sprites/              # player.png, enemy.png, coin.png
  /tiles/                # ground.png, platform.png, brick.png
  /backgrounds/          # sky.png, clouds.png
  /audio/                # jump.mp3, coin.mp3, bgmusic.mp3
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

## 📦 Asset References
Use these exact paths in your ${engine === 'phaser' ? 'this.load.image()' : 'img.src'} calls:

\`\`\`javascript
${engine === 'phaser' ? `// In preload() function
this.load.image('player', '/game-assets/sprites/player.png');
this.load.image('enemy', '/game-assets/sprites/enemy.png');
this.load.image('coin', '/game-assets/sprites/coin.png');
this.load.image('ground', '/game-assets/tiles/ground.png');
this.load.image('platform', '/game-assets/tiles/platform.png');
this.load.image('sky', '/game-assets/backgrounds/sky.png');
this.load.audio('jump', '/game-assets/audio/jump.mp3');
this.load.audio('coin', '/game-assets/audio/coin.mp3');` : `// Canvas asset loading
const playerImg = new Image();
playerImg.src = '/game-assets/sprites/player.png';
const groundImg = new Image();
groundImg.src = '/game-assets/tiles/ground.png';`}
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
${engine === 'phaser' ? `- Use Phaser's Arcade Physics for collision detection
- Implement proper scene management for level transitions
- Use object pooling for bullets/particles if needed
- Follow Phaser best practices for asset loading and scene lifecycle` : `- Implement custom collision detection
- Use requestAnimationFrame for smooth animation
- Handle keyboard input with proper event listeners
- Manage game state with clean object structure`}

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

## 📦 Assets
- Use \`/game-assets/sprites/player.png\` for player ship
- Use \`/game-assets/sprites/enemy.png\` for enemy ships
- Use colored rectangles for bullets initially

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

function generateRunnerPrompt({ originalInput, complexity, engine }: any): string {
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

function generateArcadePrompt({ originalInput, complexity, engine }: any): string {
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
   - Asset paths using /game-assets/ directory
   - Complete game mechanics description
   - Win/lose conditions
   - Technical constraints
   - Expected output format

**Always use the pre-installed assets at /game-assets/ instead of placeholder graphics.**

Example transformation:
User: "make a mario game"
→ Enhanced: [Full detailed prompt with Phaser 3 setup, platformer mechanics, asset paths, level design, etc.]

This ensures every game request results in a complete, implementable specification.
`; 