#!/usr/bin/env node

// Simple test script to verify deep link functionality
import { parseProtocolUrl, generateProtocolUrl } from './src/frontend/utils/protocolLinks.ts';

console.log('=== Deep Link Test ===');

// Test URL parsing
const testUrl = 'promptvault://search?query=test&boolean=tag:important';
console.log('\n1. Testing URL parsing:');
console.log('URL:', testUrl);

const parsed = parseProtocolUrl(testUrl);
console.log('Parsed:', parsed);

// Test URL generation
console.log('\n2. Testing URL generation:');
console.log('Generated back:', generateProtocolUrl(parsed));

// Test various URL formats
const testUrls = [
  'promptvault://search?query=test&boolean=tag:important',
  'promptvault://search?q=old&expr=tag:old',
  'promptvault://prompt/abc123',
  'promptvault://collection/mycollection',
  'promptvault://public/tx123',
  'promptvault://shared/token123'
];

console.log('\n3. Testing various URL formats:');
testUrls.forEach(url => {
  try {
    const parsed = parseProtocolUrl(url);
    console.log(`${url} -> ${JSON.stringify(parsed)}`);
  } catch (error) {
    console.error(`${url} -> ERROR:`, error.message);
  }
});

console.log('\n=== Test Complete ===');