#!/usr/bin/env node

console.log('🧪 Multi-Test - Various sizes\n');

const tests = [
  { url: 'https://en.wikipedia.org/wiki/Albert_Einstein', maxChars: 500, style: 'normal', name: 'Small (500)' },
  { url: 'https://en.wikipedia.org/wiki/Elon_Musk', maxChars: 1500, style: 'normal', name: 'Default (1500)' },
  { url: 'https://en.wikipedia.org/wiki/Donald_Trump', maxChars: 2000, style: 'long', name: 'Maximum (2000)' },
];

for (const test of tests) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Test: ${test.name}`);
  console.log(`   URL: ${test.url.split('/wiki/')[1]}`);
  console.log(`   Max chars: ${test.maxChars}, Style: ${test.style}`);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test)
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        const length = data.greentext?.length || 0;
        const lines = data.greentext.split('\n').filter(l => l.trim());
        const invalidLines = lines.filter(l => !l.trim().startsWith('>'));
        
        console.log(`✅ Generated ${length} chars (${lines.length} lines)`);
        console.log(`   Format: ${invalidLines.length === 0 ? '✅ All lines start with >' : '⚠️  ' + invalidLines.length + ' invalid lines'}`);
        console.log(`   Preview: ${data.greentext.substring(0, 100)}...`);
      } else {
        console.log(`❌ Error: ${data.error}`);
      }
    } else {
      console.log(`❌ HTTP ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
}

console.log('\n' + '='.repeat(60));
console.log('✅ All tests complete');
console.log('📊 Check server logs at /tmp/nextjs-dev.log for performance data');
