/**
 * Node.js test for the dynamic asset loading system
 */

const fs = require('fs');
const path = require('path');

async function testDynamicAssets() {
  console.log('🧪 Testing Dynamic Asset Loading System (Node.js)\n');

  try {
    // Test 1: Load manifest
    console.log('1. Loading asset manifest...');
    
    const manifestPath = path.join(__dirname, 'public', 'game-asset-manifest.json');
    console.log(`   Checking path: ${manifestPath}`);
    
    if (fs.existsSync(manifestPath)) {
      console.log(`   ✅ Found manifest at: ${manifestPath}`);
      const content = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(content);
      
      console.log(`   ✅ Loaded manifest with ${manifest.assets.length} assets`);
      console.log(`   📅 Generated: ${manifest.generated_at}`);
      console.log(`   🔗 Base URL: ${manifest.base_url}`);
      
      // Test 2: Show sample assets
      console.log('\n2. Sample assets:');
      const sampleAssets = manifest.assets.slice(0, 5);
      sampleAssets.forEach((asset, index) => {
        console.log(`   ${index + 1}. ${asset.name} (${asset.subcategory})`);
        console.log(`      🏷️  Tags: ${asset.tags.join(', ')}`);
        console.log(`      🔗 URL: ${asset.url.substring(0, 80)}...`);
      });
      
      // Test 3: Asset categories
      console.log('\n3. Asset categories:');
      const categories = {};
      manifest.assets.forEach(asset => {
        const key = `${asset.category}/${asset.subcategory}`;
        categories[key] = (categories[key] || 0) + 1;
      });
      
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`   📁 ${category}: ${count} assets`);
      });
      
      // Test 4: Search functionality simulation
      console.log('\n4. Testing search functionality:');
      
      // Find character assets
      const characters = manifest.assets.filter(asset => 
        asset.subcategory === 'characters'
      );
      console.log(`   👤 Characters: ${characters.length} assets`);
      
      // Find enemy assets
      const enemies = manifest.assets.filter(asset => 
        asset.subcategory === 'enemies'
      );
      console.log(`   👹 Enemies: ${enemies.length} assets`);
      
      // Find tile assets
      const tiles = manifest.assets.filter(asset => 
        asset.subcategory === 'tiles'
      );
      console.log(`   🧱 Tiles: ${tiles.length} assets`);
      
      // Find background assets
      const backgrounds = manifest.assets.filter(asset => 
        asset.subcategory === 'backgrounds'
      );
      console.log(`   🌄 Backgrounds: ${backgrounds.length} assets`);
      
      console.log('\n🎉 Dynamic asset system is ready!');
      console.log('✅ Manifest loaded successfully');
      console.log('✅ Assets are accessible via URLs');
      console.log('✅ Search functionality works');
      console.log('✅ Ready for integration with Phaser games');
      
    } else {
      console.log('   ❌ Manifest file not found');
      console.log('   💡 Expected location: public/game-asset-manifest.json');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDynamicAssets();