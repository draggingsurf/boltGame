import type { WebContainer } from '@webcontainer/api';
import { path as nodePath } from '~/utils/path';
import { atom, map, type MapStore } from 'nanostores';
import type { ActionAlert, BoltAction, DeployAlert, FileHistory, SupabaseAction, SupabaseAlert } from '~/types/actions';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';
import type { ActionCallbackData } from './message-parser';
import type { BoltShell } from '~/utils/shell';

const logger = createScopedLogger('ActionRunner');

export type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed';

export type BaseActionState = BoltAction & {
  status: Exclude<ActionStatus, 'failed'>;
  abort: () => void;
  executed: boolean;
  abortSignal: AbortSignal;
};

export type FailedActionState = BoltAction &
  Omit<BaseActionState, 'status'> & {
    status: Extract<ActionStatus, 'failed'>;
    error: string;
  };

export type ActionState = BaseActionState | FailedActionState;

type BaseActionUpdate = Partial<Pick<BaseActionState, 'status' | 'abort' | 'executed'>>;

export type ActionStateUpdate =
  | BaseActionUpdate
  | (Omit<BaseActionUpdate, 'status'> & { status: 'failed'; error: string });

type ActionsMap = MapStore<Record<string, ActionState>>;

class ActionCommandError extends Error {
  readonly _output: string;
  readonly _header: string;

  constructor(message: string, output: string) {
    // Create a formatted message that includes both the error message and output
    const formattedMessage = `Failed To Execute Shell Command: ${message}\n\nOutput:\n${output}`;
    super(formattedMessage);

    // Set the output separately so it can be accessed programmatically
    this._header = message;
    this._output = output;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ActionCommandError.prototype);

    // Set the name of the error for better debugging
    this.name = 'ActionCommandError';
  }

  // Optional: Add a method to get just the terminal output
  get output() {
    return this._output;
  }
  get header() {
    return this._header;
  }
}

export class ActionRunner {
  #webcontainer: Promise<WebContainer>;
  #currentExecutionPromise: Promise<void> = Promise.resolve();
  #shellTerminal: () => BoltShell;
  runnerId = atom<string>(`${Date.now()}`);
  actions: ActionsMap = map({});
  onAlert?: (alert: ActionAlert) => void;
  onSupabaseAlert?: (alert: SupabaseAlert) => void;
  onDeployAlert?: (alert: DeployAlert) => void;
  buildOutput?: { path: string; exitCode: number; output: string };

  constructor(
    webcontainerPromise: Promise<WebContainer>,
    getShellTerminal: () => BoltShell,
    onAlert?: (alert: ActionAlert) => void,
    onSupabaseAlert?: (alert: SupabaseAlert) => void,
    onDeployAlert?: (alert: DeployAlert) => void,
  ) {
    this.#webcontainer = webcontainerPromise;
    this.#shellTerminal = getShellTerminal;
    this.onAlert = onAlert;
    this.onSupabaseAlert = onSupabaseAlert;
    this.onDeployAlert = onDeployAlert;
  }

  addAction(data: ActionCallbackData) {
    const { actionId } = data;

    const actions = this.actions.get();
    const action = actions[actionId];

    if (action) {
      // action already added
      return;
    }

    const abortController = new AbortController();

    this.actions.setKey(actionId, {
      ...data.action,
      status: 'pending',
      executed: false,
      abort: () => {
        abortController.abort();
        this.#updateAction(actionId, { status: 'aborted' });
      },
      abortSignal: abortController.signal,
    });

    this.#currentExecutionPromise.then(() => {
      this.#updateAction(actionId, { status: 'running' });
    });
  }

  async runAction(data: ActionCallbackData, isStreaming: boolean = false) {
    const { actionId } = data;
    const action = this.actions.get()[actionId];

    if (!action) {
      unreachable(`Action ${actionId} not found`);
    }

    if (action.executed) {
      return; // No return value here
    }

    if (isStreaming && action.type !== 'file') {
      return; // No return value here
    }

    this.#updateAction(actionId, { ...action, ...data.action, executed: !isStreaming });

    this.#currentExecutionPromise = this.#currentExecutionPromise
      .then(() => {
        return this.#executeAction(actionId, isStreaming);
      })
      .catch((error) => {
        console.error('Action failed:', error);
      });

    await this.#currentExecutionPromise;

    return;
  }

  async #executeAction(actionId: string, isStreaming: boolean = false) {
    const action = this.actions.get()[actionId];

    this.#updateAction(actionId, { status: 'running' });

    try {
      switch (action.type) {
        case 'shell': {
          await this.#runShellAction(action);
          break;
        }
        case 'file': {
          await this.#runFileAction(action);
          break;
        }
        case 'supabase': {
          try {
            await this.handleSupabaseAction(action as SupabaseAction);
          } catch (error: any) {
            // Update action status
            this.#updateAction(actionId, {
              status: 'failed',
              error: error instanceof Error ? error.message : 'Supabase action failed',
            });

            // Return early without re-throwing
            return;
          }
          break;
        }
        case 'build': {
          const buildOutput = await this.#runBuildAction(action);

          // Store build output for deployment
          this.buildOutput = buildOutput;
          break;
        }
        case 'start': {
          // making the start app non blocking

          this.#runStartAction(action)
            .then(() => this.#updateAction(actionId, { status: 'complete' }))
            .catch((err: Error) => {
              if (action.abortSignal.aborted) {
                return;
              }

              this.#updateAction(actionId, { status: 'failed', error: 'Action failed' });
              logger.error(`[${action.type}]:Action failed\n\n`, err);

              if (!(err instanceof ActionCommandError)) {
                return;
              }

              this.onAlert?.({
                type: 'error',
                title: 'Dev Server Failed',
                description: err.header,
                content: err.output,
              });
            });

          /*
           * adding a delay to avoid any race condition between 2 start actions
           * i am up for a better approach
           */
          await new Promise((resolve) => setTimeout(resolve, 2000));

          return;
        }
      }

      this.#updateAction(actionId, {
        status: isStreaming ? 'running' : action.abortSignal.aborted ? 'aborted' : 'complete',
      });
    } catch (error) {
      if (action.abortSignal.aborted) {
        return;
      }

      this.#updateAction(actionId, { status: 'failed', error: 'Action failed' });
      logger.error(`[${action.type}]:Action failed\n\n`, error);

      if (!(error instanceof ActionCommandError)) {
        return;
      }

      this.onAlert?.({
        type: 'error',
        title: 'Dev Server Failed',
        description: error.header,
        content: error.output,
      });

      // re-throw the error to be caught in the promise chain
      throw error;
    }
  }

  async #runShellAction(action: ActionState) {
    if (action.type !== 'shell') {
      unreachable('Expected shell action');
    }

    const shell = this.#shellTerminal();
    await shell.ready();

    if (!shell || !shell.terminal || !shell.process) {
      unreachable('Shell terminal not found');
    }

    const resp = await shell.executeCommand(this.runnerId.get(), action.content, () => {
      logger.debug(`[${action.type}]:Aborting Action\n\n`, action);
      action.abort();
    });
    logger.debug(`${action.type} Shell Response: [exit code:${resp?.exitCode}]`);

    if (resp?.exitCode != 0) {
      throw new ActionCommandError(`Failed To Execute Shell Command`, resp?.output || 'No Output Available');
    }
  }

  async #runStartAction(action: ActionState) {
    if (action.type !== 'start') {
      unreachable('Expected shell action');
    }

    if (!this.#shellTerminal) {
      unreachable('Shell terminal not found');
    }

    const shell = this.#shellTerminal();
    await shell.ready();

    if (!shell || !shell.terminal || !shell.process) {
      unreachable('Shell terminal not found');
    }

    const resp = await shell.executeCommand(this.runnerId.get(), action.content, () => {
      logger.debug(`[${action.type}]:Aborting Action\n\n`, action);
      action.abort();
    });
    logger.debug(`${action.type} Shell Response: [exit code:${resp?.exitCode}]`);

    if (resp?.exitCode != 0) {
      throw new ActionCommandError('Failed To Start Application', resp?.output || 'No Output Available');
    }

    return resp;
  }

  async #runFileAction(action: ActionState) {
    if (action.type !== 'file') {
      unreachable('Expected file action');
    }

    const webcontainer = await this.#webcontainer;
    const relativePath = nodePath.relative(webcontainer.workdir, action.filePath);

    // AUTO-INJECT ASSETS: If this is a game file, automatically create assets first
    if (this.#isGameFile(action.filePath, action.content)) {
      await this.#ensureGameAssets(webcontainer);
    }

    let folder = nodePath.dirname(relativePath);

    // remove trailing slashes
    folder = folder.replace(/\/+$/g, '');

    if (folder !== '.') {
      try {
        await webcontainer.fs.mkdir(folder, { recursive: true });
        logger.debug('Created folder', folder);
      } catch (error) {
        logger.error('Failed to create folder\n\n', error);
      }
    }

    try {
      await webcontainer.fs.writeFile(relativePath, action.content);
      logger.debug(`File written ${relativePath}`);
    } catch (error) {
      logger.error('Failed to write file\n\n', error);
    }
  }

  // Check if this is a game file that needs assets
  #isGameFile(filePath: string, content: string): boolean {
    const gameIndicators = [
      'phaser', 'Phaser', 'kaboom', 'game', 'player', 'enemy', 'coin',
      'this.load.image', 'preload()', 'create()', 'update()', 'sprite',
      'physics', 'scene', 'canvas', 'arcade'
    ];
    
    // Detect game genre for smart asset recommendations
    const isPlatformer = content.includes('platform') || content.includes('jump') || content.includes('gravity');
    const isPuzzle = content.includes('snake') || content.includes('tetris') || content.includes('grid') || content.includes('ludo');
    const isBoard = content.includes('chess') || content.includes('checkers') || content.includes('board');
    const isCard = content.includes('poker') || content.includes('card') || content.includes('deck');
    
    // Check for canvas drawing violations
    const canvasViolations = [
      'ctx.fillRect', 'ctx.arc', 'ctx.fillStyle', 'ctx.strokeRect',
      'fillRect(', 'arc(', 'fillStyle =', 'strokeStyle ='
    ];
    
    const hasViolations = canvasViolations.some(violation => content.includes(violation));
    if (hasViolations) {
      logger.warn('🚨 ASSET VIOLATION DETECTED: Game file contains canvas drawing commands instead of sprite loading!');
      logger.warn('File:', filePath);
      
      if (isPlatformer) {
        logger.warn('🎮 PLATFORMER DETECTED: Use Kenney sprites for professional graphics');
        logger.warn('✅ Use: this.load.image("player", "/game-assets/sprites/player.png")');
        logger.warn('✅ Use: this.load.image("coin", "/game-assets/sprites/coin.png")');
        logger.warn('✅ Use: this.add.sprite(x, y, "player").setScale(0.8)');
      } else if (isPuzzle || isBoard || isCard) {
        logger.warn('🧩 PUZZLE/BOARD GAME DETECTED: Use geometric shapes, not canvas drawing');
        logger.warn('✅ Use: this.add.rectangle(x, y, width, height, color)');
        logger.warn('✅ Use: this.add.circle(x, y, radius, color)');
        logger.warn('✅ Use: this.add.text(x, y, "text", {fontSize: "32px"})');
      } else {
        logger.warn('❌ Found canvas drawing - should use proper Phaser graphics');
        logger.warn('✅ Use: this.add.sprite() for characters and objects');
        logger.warn('✅ Use: this.add.rectangle() for simple shapes');
      }
      
      logger.warn('This violates the asset-first GameTerminal methodology.');
    }
    
    return gameIndicators.some(indicator => 
      content.includes(indicator) || filePath.includes('game')
    );
  }

  // Automatically copy Kenney game assets if they don't exist
  async #ensureGameAssets(webcontainer: any): Promise<void> {
    try {
      // Check if assets already exist 
      const assetsExist = await webcontainer.fs.readdir('public/game-assets').catch(() => false);
      if (assetsExist) {
        logger.info('🎮 Kenney assets already exist, skipping copy');
        return; // Assets already copied
      }

      logger.info('🎮 Copying Kenney pixel art assets to WebContainer...');

      // Create correct asset directory structure
      await webcontainer.fs.mkdir('public/game-assets/sprites', { recursive: true });
      await webcontainer.fs.mkdir('public/game-assets/tiles', { recursive: true });
      await webcontainer.fs.mkdir('public/game-assets/backgrounds', { recursive: true });

      // Kenney PNG assets to copy
      const kenneyAssets = [
        // Player sprites
        'sprites/player.png',
        'sprites/player_walk1.png', 
        'sprites/player_walk2.png',
        'sprites/player_jump.png',
        'sprites/player_hit.png',
        
        // Enemy sprites
        'sprites/enemy.png',
        'sprites/enemy_walk1.png',
        'sprites/enemy_walk2.png',
        
        // Items
        'sprites/coin.png',
        'sprites/coin_inactive.png',
        'sprites/torch.png',
        'sprites/weight.png',
        'sprites/window.png',
        
        // Platform tiles
        'tiles/ground.png',
        'tiles/platform.png',
        'tiles/platform_top.png',
        'tiles/platform_left.png',
        'tiles/platform_right.png',
        'tiles/ice_platform.png',
        'tiles/sand_platform.png',
        
        // Backgrounds
        'backgrounds/cloud.png',
        'backgrounds/cloud_bg.png'
      ];

      let successCount = 0;
      let failCount = 0;

      // Copy each Kenney asset from main app to WebContainer
      for (const assetPath of kenneyAssets) {
        try {
          // Fetch from main Bolt.new app (where assets are served)
          const response = await fetch(`/game-assets/${assetPath}`);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Write binary file to WebContainer
            await webcontainer.fs.writeFile(`public/game-assets/${assetPath}`, uint8Array);
            logger.info(`✅ Copied Kenney asset: /game-assets/${assetPath}`);
            successCount++;
          } else {
            logger.warn(`❌ Failed to fetch Kenney asset (${response.status}): ${assetPath}`);
            failCount++;
          }
        } catch (error) {
          logger.error(`💥 Error copying asset ${assetPath}:`, error);
          failCount++;
        }
      }

      // Create asset summary for developers
      const assetSummary = `# Kenney Game Assets

Professional pixel art sprites from Kenney.nl copied automatically.

## Successfully Copied: ${successCount} assets
## Failed: ${failCount} assets

## Available Assets:
- Player: player.png, player_walk1.png, player_walk2.png, player_jump.png, player_hit.png
- Enemies: enemy.png, enemy_walk1.png, enemy_walk2.png  
- Items: coin.png, coin_inactive.png, torch.png, weight.png, window.png
- Platforms: ground.png, platform.png, platform_top.png, platform_left.png, platform_right.png
- Backgrounds: cloud.png, cloud_bg.png

## Usage in Phaser:
\`\`\`javascript
// Load assets in preload()
this.load.image('player', '/game-assets/sprites/player.png');
this.load.image('coin', '/game-assets/sprites/coin.png');
this.load.image('ground', '/game-assets/tiles/ground.png');

// Display sprites in create()
this.add.sprite(x, y, 'player');
this.add.sprite(x, y, 'coin');
\`\`\`

## Asset Paths:
All assets are available at /game-assets/[category]/[filename].png
- /game-assets/sprites/ - Characters and items
- /game-assets/tiles/ - Platforms and terrain  
- /game-assets/backgrounds/ - Sky and scenery elements
`;

      await webcontainer.fs.writeFile('public/game-assets/README.md', assetSummary);
      
      if (successCount > 0) {
        logger.info(`🎮 Kenney pixel art assets copied successfully! (${successCount}/${kenneyAssets.length})`);
      } else {
        logger.error('🚨 Failed to copy any Kenney assets! Games will have missing sprites.');
      }
      
    } catch (error) {
      logger.error('💥 Critical error in Kenney asset copying system:', error);
    }
  }

  #updateAction(id: string, newState: ActionStateUpdate) {
    const actions = this.actions.get();

    this.actions.setKey(id, { ...actions[id], ...newState });
  }

  async getFileHistory(filePath: string): Promise<FileHistory | null> {
    try {
      const webcontainer = await this.#webcontainer;
      const historyPath = this.#getHistoryPath(filePath);
      const content = await webcontainer.fs.readFile(historyPath, 'utf-8');

      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to get file history:', error);
      return null;
    }
  }

  async saveFileHistory(filePath: string, history: FileHistory) {
    // const webcontainer = await this.#webcontainer;
    const historyPath = this.#getHistoryPath(filePath);

    await this.#runFileAction({
      type: 'file',
      filePath: historyPath,
      content: JSON.stringify(history),
      changeSource: 'auto-save',
    } as any);
  }

  #getHistoryPath(filePath: string) {
    return nodePath.join('.history', filePath);
  }

  async #runBuildAction(action: ActionState) {
    if (action.type !== 'build') {
      unreachable('Expected build action');
    }

    // Trigger build started alert
    this.onDeployAlert?.({
      type: 'info',
      title: 'Building Application',
      description: 'Building your application...',
      stage: 'building',
      buildStatus: 'running',
      deployStatus: 'pending',
      source: 'netlify',
    });

    const webcontainer = await this.#webcontainer;

    // Create a new terminal specifically for the build
    const buildProcess = await webcontainer.spawn('npm', ['run', 'build']);

    let output = '';
    buildProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          output += data;
        },
      }),
    );

    const exitCode = await buildProcess.exit;

    if (exitCode !== 0) {
      // Trigger build failed alert
      this.onDeployAlert?.({
        type: 'error',
        title: 'Build Failed',
        description: 'Your application build failed',
        content: output || 'No build output available',
        stage: 'building',
        buildStatus: 'failed',
        deployStatus: 'pending',
        source: 'netlify',
      });

      throw new ActionCommandError('Build Failed', output || 'No Output Available');
    }

    // Trigger build success alert
    this.onDeployAlert?.({
      type: 'success',
      title: 'Build Completed',
      description: 'Your application was built successfully',
      stage: 'deploying',
      buildStatus: 'complete',
      deployStatus: 'running',
      source: 'netlify',
    });

    // Check for common build directories
    const commonBuildDirs = ['dist', 'build', 'out', 'output', '.next', 'public'];

    let buildDir = '';

    // Try to find the first existing build directory
    for (const dir of commonBuildDirs) {
      const dirPath = nodePath.join(webcontainer.workdir, dir);

      try {
        await webcontainer.fs.readdir(dirPath);
        buildDir = dirPath;
        break;
      } catch {
        continue;
      }
    }

    // If no build directory was found, use the default (dist)
    if (!buildDir) {
      buildDir = nodePath.join(webcontainer.workdir, 'dist');
    }

    return {
      path: buildDir,
      exitCode,
      output,
    };
  }
  async handleSupabaseAction(action: SupabaseAction) {
    const { operation, content, filePath } = action;
    logger.debug('[Supabase Action]:', { operation, filePath, content });

    switch (operation) {
      case 'migration':
        if (!filePath) {
          throw new Error('Migration requires a filePath');
        }

        // Show alert for migration action
        this.onSupabaseAlert?.({
          type: 'info',
          title: 'Supabase Migration',
          description: `Create migration file: ${filePath}`,
          content,
          source: 'supabase',
        });

        // Only create the migration file
        await this.#runFileAction({
          type: 'file',
          filePath,
          content,
          changeSource: 'supabase',
        } as any);
        return { success: true };

      case 'query': {
        // Always show the alert and let the SupabaseAlert component handle connection state
        this.onSupabaseAlert?.({
          type: 'info',
          title: 'Supabase Query',
          description: 'Execute database query',
          content,
          source: 'supabase',
        });

        // The actual execution will be triggered from SupabaseChatAlert
        return { pending: true };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  // Add this method declaration to the class
  handleDeployAction(
    stage: 'building' | 'deploying' | 'complete',
    status: ActionStatus,
    details?: {
      url?: string;
      error?: string;
      source?: 'netlify' | 'vercel' | 'github';
    },
  ): void {
    if (!this.onDeployAlert) {
      logger.debug('No deploy alert handler registered');
      return;
    }

    const alertType = status === 'failed' ? 'error' : status === 'complete' ? 'success' : 'info';

    const title =
      stage === 'building'
        ? 'Building Application'
        : stage === 'deploying'
          ? 'Deploying Application'
          : 'Deployment Complete';

    const description =
      status === 'failed'
        ? `${stage === 'building' ? 'Build' : 'Deployment'} failed`
        : status === 'running'
          ? `${stage === 'building' ? 'Building' : 'Deploying'} your application...`
          : status === 'complete'
            ? `${stage === 'building' ? 'Build' : 'Deployment'} completed successfully`
            : `Preparing to ${stage === 'building' ? 'build' : 'deploy'} your application`;

    const buildStatus =
      stage === 'building' ? status : stage === 'deploying' || stage === 'complete' ? 'complete' : 'pending';

    const deployStatus = stage === 'building' ? 'pending' : status;

    this.onDeployAlert({
      type: alertType,
      title,
      description,
      content: details?.error || '',
      url: details?.url,
      stage,
      buildStatus: buildStatus as any,
      deployStatus: deployStatus as any,
      source: details?.source || 'netlify',
    });
  }
}
