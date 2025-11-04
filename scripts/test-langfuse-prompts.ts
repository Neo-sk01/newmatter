/**
 * Test script for Langfuse prompt fetching
 * 
 * This script tests:
 * 1. Fetching prompts by name
 * 2. Verifying prompts are returned correctly
 * 3. Compiling prompts with sample variables
 * 4. Verifying compiled output matches expectations
 * 
 * Usage: npx tsx scripts/test-langfuse-prompts.ts
 */

import { getPrompt, getCompiledPrompt } from '../src/lib/langfuse/prompts';

async function testPromptFetching() {
  console.log('🧪 Testing Langfuse Prompt Fetching\n');
  
  try {
    // Test 1: Fetch email-generation-system prompt
    console.log('📝 Test 1: Fetching email-generation-system prompt...');
    const systemPrompt = await getPrompt('email-generation-system');
    console.log('✅ Successfully fetched system prompt');
    console.log(`   - Name: ${systemPrompt.name}`);
    console.log(`   - Version: ${systemPrompt.version}`);
    console.log(`   - Type: ${systemPrompt.type}`);
    console.log(`   - Labels: ${systemPrompt.labels.join(', ')}`);
    console.log(`   - Config:`, systemPrompt.config);
    console.log();

    // Test 2: Fetch email-generation-user prompt
    console.log('📝 Test 2: Fetching email-generation-user prompt...');
    const userPrompt = await getPrompt('email-generation-user');
    console.log('✅ Successfully fetched user prompt');
    console.log(`   - Name: ${userPrompt.name}`);
    console.log(`   - Version: ${userPrompt.version}`);
    console.log(`   - Type: ${userPrompt.type}`);
    console.log(`   - Labels: ${userPrompt.labels.join(', ')}`);
    console.log(`   - Config:`, userPrompt.config);
    console.log();

    // Test 3: Compile user prompt with sample variables
    console.log('📝 Test 3: Compiling user prompt with sample variables...');
    const sampleVariables = {
      body: 'I wanted to reach out regarding our upcoming product launch.',
      subject: 'Product Launch Announcement',
      name: 'John Doe',
      date: new Date().toLocaleDateString()
    };
    
    const compiledPrompt = await getCompiledPrompt(
      'email-generation-user',
      sampleVariables
    );
    
    console.log('✅ Successfully compiled prompt');
    console.log('   - Compiled output:');
    console.log('   ', compiledPrompt);
    console.log();

    // Test 4: Verify compiled output contains variables
    console.log('📝 Test 4: Verifying compiled output contains variables...');
    const compiledStr = typeof compiledPrompt === 'string' 
      ? compiledPrompt 
      : JSON.stringify(compiledPrompt);
    
    const checks = [
      { variable: 'body', value: sampleVariables.body },
      { variable: 'subject', value: sampleVariables.subject },
      { variable: 'name', value: sampleVariables.name },
      { variable: 'date', value: sampleVariables.date }
    ];

    let allChecksPass = true;
    for (const check of checks) {
      const contains = compiledStr.includes(check.value);
      if (contains) {
        console.log(`   ✅ Variable {{${check.variable}}} was replaced correctly`);
      } else {
        console.log(`   ❌ Variable {{${check.variable}}} was NOT replaced`);
        allChecksPass = false;
      }
    }
    console.log();

    // Test 5: Fetch with specific label
    console.log('📝 Test 5: Fetching prompt with "production" label...');
    const prodPrompt = await getPrompt('email-generation-system', { 
      label: 'production' 
    });
    console.log('✅ Successfully fetched prompt with production label');
    console.log(`   - Has "production" label: ${prodPrompt.labels.includes('production')}`);
    console.log();

    // Test 6: Verify prompt config structure
    console.log('📝 Test 6: Verifying prompt config structure...');
    const hasModel = systemPrompt.config && 'model' in systemPrompt.config;
    const hasTemp = systemPrompt.config && 'temperature' in systemPrompt.config;
    
    console.log(`   - Has model parameter: ${hasModel ? '✅' : '❌'}`);
    console.log(`   - Has temperature parameter: ${hasTemp ? '✅' : '❌'}`);
    console.log();

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    if (allChecksPass) {
      console.log('✅ All tests passed successfully!');
    } else {
      console.log('⚠️  Some tests failed. Please review the output above.');
    }
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('\nPossible issues:');
    console.error('1. Prompts not created in Langfuse UI yet');
    console.error('2. Environment variables not set correctly');
    console.error('3. Network connectivity issues');
    console.error('4. Incorrect prompt names or labels');
    process.exit(1);
  }
}

// Run the tests
testPromptFetching();
