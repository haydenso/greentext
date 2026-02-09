#!/usr/bin/env node

/**
 * Performance test script for the greentext API
 * Tests Wikipedia fetch and Azure OpenAI call timing
 */

import { fetchWikipediaSummary } from './lib/wiki.ts';

const TEST_URLS = [
  'https://en.wikipedia.org/wiki/Elon_Musk',
  'https://en.wikipedia.org/wiki/Albert_Einstein',
  'https://en.wikipedia.org/wiki/Donald_Trump',
];

async function testWikipediaPerformance() {
  console.log('\n=== Wikipedia Fetch Performance Test ===\n');
  
  for (const url of TEST_URLS) {
    const startTime = Date.now();
    try {
      const result = await fetchWikipediaSummary(url);
      const duration = Date.now() - startTime;
      console.log(`✓ ${result.title}: ${duration}ms`);
      console.log(`  Extract length: ${result.extract.length} chars\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`✗ ${url}: ${duration}ms - ${error.message}\n`);
    }
  }
}

async function testFullAPIPerformance() {
  console.log('\n=== Full API Performance Test ===\n');
  console.log('Testing with different character limits...\n');
  
  const limits = [500, 1000, 1500];
  const testUrl = 'https://en.wikipedia.org/wiki/Elon_Musk';
  
  for (const maxChars of limits) {
    const startTime = Date.now();
    try {
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl,
          style: 'normal',
          maxChars,
        }),
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (data.success) {
        console.log(`✓ maxChars=${maxChars}: ${duration}ms`);
        console.log(`  Output length: ${data.greentext.length} chars\n`);
      } else {
        console.log(`✗ maxChars=${maxChars}: ${duration}ms - ${data.error}\n`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`✗ maxChars=${maxChars}: ${duration}ms - ${error.message}\n`);
    }
  }
}

async function main() {
  // Test Wikipedia fetch performance
  await testWikipediaPerformance();
  
  // Check if dev server is running
  try {
    await fetch('http://localhost:3000');
    await testFullAPIPerformance();
  } catch (error) {
    console.log('\n⚠️  Dev server not running. Skipping full API test.');
    console.log('   Run "npm run dev" in another terminal to test the full API.\n');
  }
  
  console.log('\n=== Performance Recommendations ===\n');
  console.log('1. Wikipedia fetch: Should be <500ms with caching');
  console.log('2. Azure OpenAI: Main bottleneck (5-15s for reasoning models)');
  console.log('3. Consider streaming responses for better UX');
  console.log('4. Add Redis/Vercel KV for production caching');
  console.log('5. Use edge functions for faster cold starts\n');
}

main().catch(console.error);
