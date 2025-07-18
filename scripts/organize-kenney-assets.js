#!/usr/bin/env node

/**
 * Kenney Asset Organizer
 * Automatically organizes Kenney platformer assets into proper folder structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KENNEY_SOURCE = 'public/kenney_new-platformer-pack-1.0 (2)';
const TARGET_FOLDERS = {
  sprites: 'public/game-assets/sprites',
  tiles: 'public/game-assets/tiles', 
  backgrounds: 'public/game-assets/backgrounds',
  audio: 'public/game-assets/audio'
};

// Asset mapping rules based on actual Kenney structure
const ASSET_MAPPINGS = {
  // Character sprites (choose yellow character as default player)
  'character_yellow_idle': { target: 'sprites', rename: 'player.png' },
  'character_yellow_walk_a': { target: 'sprites', rename: 'player_walk1.png' },
  'character_yellow_walk_b': { target: 'sprites', rename: 'player_walk2.png' },
  'character_yellow_jump': { target: 'sprites', rename: 'player_jump.png' },
  'character_yellow_hit': { target: 'sprites', rename: 'player_hit.png' },
  
  // Enemies (use other colored characters)
  'character_green_idle': { target: 'sprites', rename: 'enemy.png' },
  'character_green_walk_a': { target: 'sprites', rename: 'enemy_walk1.png' },
  'character_green_walk_b': { target: 'sprites', rename: 'enemy_walk2.png' },
  
  // Coins and collectibles
  'block_coin_active': { target: 'sprites', rename: 'coin.png' },
  'block_coin': { target: 'sprites', rename: 'coin_inactive.png' },
  
  // Platform tiles (stone terrain)
  'terrain_stone_block': { target: 'tiles', rename: 'ground.png' },
  'terrain_stone_horizontal_middle': { target: 'tiles', rename: 'platform.png' },
  'terrain_stone_block_top': { target: 'tiles', rename: 'platform_top.png' },
  'terrain_stone_horizontal_left': { target: 'tiles', rename: 'platform_left.png' },
  'terrain_stone_horizontal_right': { target: 'tiles', rename: 'platform_right.png' },
  
  // Additional platforms
  'terrain_snow_block': { target: 'tiles', rename: 'ice_platform.png' },
  'terrain_sand_block': { target: 'tiles', rename: 'sand_platform.png' },
  
  // Background elements
  'terrain_stone_cloud': { target: 'backgrounds', rename: 'cloud.png' },
  'terrain_stone_cloud_background': { target: 'backgrounds', rename: 'cloud_bg.png' },
  
  // Interactive elements
  'torch_on_a': { target: 'sprites', rename: 'torch.png' },
  'weight': { target: 'sprites', rename: 'weight.png' },
  'window': { target: 'sprites', rename: 'window.png' }
};

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

function copyAsset(sourceFile, targetFile) {
  try {
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`✅ Copied: ${path.basename(sourceFile)} → ${targetFile}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to copy ${sourceFile}: ${error.message}`);
    return false;
  }
}

function findAssetFile(assetName) {
  const searchPaths = [
    `${KENNEY_SOURCE}/Sprites/Characters/Default`,
    `${KENNEY_SOURCE}/Sprites/Tiles/Default`,
    `${KENNEY_SOURCE}/Sprites/Enemies`,
    `${KENNEY_SOURCE}/Sprites/Backgrounds`,
    `${KENNEY_SOURCE}/Sounds`
  ];
  
  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      const files = fs.readdirSync(searchPath);
      const matchingFile = files.find(file => file.startsWith(assetName));
      if (matchingFile) {
        return path.join(searchPath, matchingFile);
      }
    }
  }
  return null;
}

function cleanupEmptyFolders(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    // Remove empty subdirectories first
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        cleanupEmptyFolders(fullPath);
        
        // Check if directory is now empty
        if (fs.readdirSync(fullPath).length === 0) {
          fs.rmdirSync(fullPath);
          console.log(`🗑️  Removed empty directory: ${fullPath}`);
        }
      }
    }
  } catch (error) {
    console.error(`⚠️  Error cleaning up ${dirPath}: ${error.message}`);
  }
}

function deleteUnnecessaryFiles() {
  const unnecessaryFiles = [
    `${KENNEY_SOURCE}/Visit Kenney.url`,
    `${KENNEY_SOURCE}/Visit Patreon.url`,
    `${KENNEY_SOURCE}/Sample A.png`,
    `${KENNEY_SOURCE}/Sample B.png`,
    `${KENNEY_SOURCE}/Preview (Backgrounds).png`,
    `${KENNEY_SOURCE}/Preview (Tiles).png`,
    `${KENNEY_SOURCE}/Preview (Characters).png`
  ];
  
  for (const file of unnecessaryFiles) {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`🗑️  Removed unnecessary file: ${path.basename(file)}`);
      } catch (error) {
        console.error(`⚠️  Could not remove ${file}: ${error.message}`);
      }
    }
  }
}

function main() {
  console.log('🎮 Starting Kenney Asset Organization...\n');
  
  // Check if Kenney source exists
  if (!fs.existsSync(KENNEY_SOURCE)) {
    console.error(`❌ Kenney source folder not found: ${KENNEY_SOURCE}`);
    console.log('Please make sure you have placed the Kenney assets in the correct location.');
    return;
  }
  
  // Ensure target directories exist
  Object.values(TARGET_FOLDERS).forEach(ensureDirectoryExists);
  
  let copiedCount = 0;
  let totalAssets = Object.keys(ASSET_MAPPINGS).length;
  
  // Copy and rename assets
  console.log('📦 Organizing assets...\n');
  
  for (const [assetName, config] of Object.entries(ASSET_MAPPINGS)) {
    const sourceFile = findAssetFile(assetName);
    
    if (sourceFile) {
      const targetDir = TARGET_FOLDERS[config.target];
      const targetFile = path.join(targetDir, config.rename);
      
      if (copyAsset(sourceFile, targetFile)) {
        copiedCount++;
      }
    } else {
      console.log(`⚠️  Asset not found: ${assetName}`);
    }
  }
  
  // Copy license file
  const licenseSource = `${KENNEY_SOURCE}/License.txt`;
  const licenseTarget = 'public/game-assets/LICENSE.txt';
  if (fs.existsSync(licenseSource)) {
    copyAsset(licenseSource, licenseTarget);
  }
  
  // Clean up unnecessary files
  console.log('\n🧹 Cleaning up...\n');
  deleteUnnecessaryFiles();
  
  // Clean up empty folders
  cleanupEmptyFolders(KENNEY_SOURCE);
  
  // Summary
  console.log('\n✨ Organization Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   • ${copiedCount}/${totalAssets} assets organized`);
  console.log(`   • Assets available in /game-assets/ folders`);
  console.log(`   • Ready for Phaser 3 game development!\n`);
  
  console.log('🎯 Usage in your games:');
  console.log("   this.load.image('player', '/game-assets/sprites/player.png');");
  console.log("   this.load.image('ground', '/game-assets/tiles/ground.png');");
  console.log("   this.load.image('coin', '/game-assets/sprites/coin.png');\n");
  
  if (copiedCount === totalAssets) {
    console.log('🎉 All assets successfully organized! Ready for game development.');
  } else {
    console.log(`⚠️  ${totalAssets - copiedCount} assets were not found. Check the source folder structure.`);
  }
}

// Run the script
main(); 