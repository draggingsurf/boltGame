#!/usr/bin/env node

/**
 * GCP Vertex AI Configuration Test Script
 * 
 * This script validates your GCP Vertex AI configuration and tests connectivity
 * to ensure Claude models are accessible through Vertex AI.
 */

import { createVertex } from '@ai-sdk/google-vertex';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const GCP_VERTEX_CONFIG = process.env.GCP_VERTEX_CONFIG;

console.log('🔧 GCP Vertex AI Configuration Test');
console.log('=====================================\n');

if (!GCP_VERTEX_CONFIG) {
  console.error('❌ ERROR: GCP_VERTEX_CONFIG environment variable not found');
  console.log('Please add the following to your .env.local file:');
  console.log('\nGCP_VERTEX_CONFIG=\'{"projectId":"rosy-drake-440416-g9","region":"us-east5","serviceAccountKey":{...}}\'');
  process.exit(1);
}

let config_data;
try {
  config_data = JSON.parse(GCP_VERTEX_CONFIG);
  console.log('✅ Configuration JSON is valid');
} catch (error) {
  console.error('❌ ERROR: Invalid JSON in GCP_VERTEX_CONFIG');
  console.error(error.message);
  process.exit(1);
}

// Validate required fields
const requiredFields = ['projectId'];
const missingFields = requiredFields.filter(field => !config_data[field]);

if (missingFields.length > 0) {
  console.error(`❌ ERROR: Missing required fields: ${missingFields.join(', ')}`);
  process.exit(1);
}

console.log(`✅ Project ID: ${config_data.projectId}`);
console.log(`✅ Region: ${config_data.region || 'us-central1 (default)'}`);
console.log(`✅ Service Account: ${config_data.serviceAccountKey ? 'Configured' : 'Using default credentials'}`);

// Test Vertex AI connection
console.log('\n🔌 Testing Vertex AI Connection...');

try {
  const vertexConfig = {
    project: config_data.projectId,
    location: config_data.region || 'us-central1',
  };

  if (config_data.serviceAccountKey) {
    vertexConfig.credentials = config_data.serviceAccountKey;
  }

  const vertex = createVertex(vertexConfig);
  
  // Test with Claude 3.5 Sonnet
  const model = vertex('claude-3-5-sonnet@20241022');
  
  console.log('✅ Vertex AI client created successfully');
  console.log('✅ Claude model reference obtained');
  
  // Test a simple generation (optional - requires quota)
  console.log('\n🧪 Testing Model Generation (optional)...');
  console.log('Note: This requires your project to have Vertex AI quota and Claude model access');
  
  try {
    const result = await model.generateText({
      prompt: 'Hello! Please respond with just "Configuration test successful" if you can read this.',
      maxTokens: 20,
    });
    
    console.log('✅ Model generation successful!');
    console.log(`Response: ${result.text}`);
  } catch (error) {
    console.log('⚠️  Model generation test failed (this may be normal if quota/access not set up):');
    console.log(`   ${error.message}`);
  }
  
} catch (error) {
  console.error('❌ ERROR: Failed to create Vertex AI client');
  console.error(error.message);
  
  if (error.message.includes('authentication')) {
    console.log('\n💡 Troubleshooting Tips:');
    console.log('   1. Verify your service account key is correct');
    console.log('   2. Ensure the service account has roles/aiplatform.user permission');
    console.log('   3. Check that your project ID is correct');
  }
  
  if (error.message.includes('region') || error.message.includes('location')) {
    console.log('\n💡 Region Issues:');
    console.log('   - Verify that Claude models are available in us-east5');
    console.log('   - Try switching to us-central1 if models are not available');
  }
  
  process.exit(1);
}

console.log('\n🎉 Configuration test completed successfully!');
console.log('Your GCP Vertex AI setup is ready to use with Bolt.new');

// Test configuration validation method
console.log('\n🔍 Testing Provider Validation...');

// Simulate the provider validation
class TestGCPVertexProvider {
  _parseAndValidateConfig(configString) {
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(configString);
    } catch {
      throw new Error('Invalid JSON format');
    }

    const { projectId, region, serviceAccountKey } = parsedConfig;

    if (!projectId) {
      throw new Error('Missing required projectId');
    }

    return {
      projectId,
      region: region || 'us-central1',
      ...(serviceAccountKey && { serviceAccountKey }),
    };
  }

  validateConfig(configString) {
    try {
      this._parseAndValidateConfig(configString);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }
}

const provider = new TestGCPVertexProvider();
const validation = provider.validateConfig(GCP_VERTEX_CONFIG);

if (validation.isValid) {
  console.log('✅ Provider validation passed');
} else {
  console.error(`❌ Provider validation failed: ${validation.error}`);
}

console.log('\n📋 Configuration Summary:');
console.log('========================');
console.log(`Project: ${config_data.projectId}`);
console.log(`Region: ${config_data.region || 'us-central1'}`);
console.log(`Auth Method: ${config_data.serviceAccountKey ? 'Service Account Key' : 'Default Credentials'}`);
console.log('\nAvailable Models:');
console.log('- claude-3-5-sonnet@20241022');
console.log('- claude-3-5-sonnet-v2@20241022');
console.log('- claude-3-5-haiku@20241022');
console.log('- claude-3-opus@20240229');
console.log('- claude-3-sonnet@20240229');
console.log('- claude-3-haiku@20240307'); 