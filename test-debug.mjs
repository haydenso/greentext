#!/usr/bin/env node

/**
 * Debug test for greentext generation
 * Tests the full flow and logs everything
 */

async function testGeneration() {
  console.log('🔍 Debug Test - Greentext Generation\n');
  console.log('='.repeat(60));
  
  const testCases = [
    {
      name: 'Short (500 chars)',
      url: 'https://en.wikipedia.org/wiki/Albert_Einstein',
      maxChars: 500,
      style: 'normal'
    },
    {
      name: 'Medium (1500 chars)',
      url: 'https://en.wikipedia.org/wiki/Elon_Musk',
      maxChars: 1500,
      style: 'normal'
    },
    {
      name: 'Long style (1500 chars)',
      url: 'https://en.wikipedia.org/wiki/Donald_Trump',
      maxChars: 1500,
      style: 'long'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    console.log(`   Max chars: ${testCase.maxChars}, Style: ${testCase.style}`);
    console.log('-'.repeat(60));
    
    const startTime = Date.now();
    let chunkCount = 0;
    let totalContent = '';
    let firstChunkTime = 0;
    
    try {
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testCase.url,
          style: testCase.style,
          maxChars: testCase.maxChars,
        }),
      });
      
      if (!response.ok) {
        console.error(`❌ Request failed: ${response.status}`);
        const data = await response.json();
        console.error(`   Error: ${data.error}`);
        continue;
      }
      
      const contentType = response.headers.get('content-type');
      
      if (!contentType?.includes('text/event-stream')) {
        console.log('⚠️  Not streaming - got JSON response');
        const data = await response.json();
        if (data.success) {
          console.log(`✅ Generated ${data.greentext.length} chars`);
          console.log(`📄 Content:\n${data.greentext.substring(0, 200)}...`);
        }
        continue;
      }
      
      console.log('✅ Streaming response detected');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') {
            continue;
          }
          
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const data = JSON.parse(jsonStr);
              
              if (data.content) {
                chunkCount++;
                totalContent += data.content;
                
                if (firstChunkTime === 0) {
                  firstChunkTime = Date.now() - startTime;
                  console.log(`⚡ First chunk in ${firstChunkTime}ms`);
                }
              }
            } catch (e) {
              console.error('Parse error:', e.message);
            }
          }
        }
      }
      
      const totalTime = Date.now() - startTime;
      
      console.log('\n📊 Results:');
      console.log(`   Time to first chunk: ${firstChunkTime}ms`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Total chunks: ${chunkCount}`);
      console.log(`   Content length: ${totalContent.length} chars`);
      console.log(`   Target: ${testCase.maxChars} chars`);
      console.log(`   Difference: ${totalContent.length - testCase.maxChars} chars (${((totalContent.length / testCase.maxChars) * 100).toFixed(1)}%)`);
      
      console.log('\n📄 Generated Content:');
      console.log(totalContent);
      
      if (totalContent.length < testCase.maxChars * 0.5) {
        console.log('\n⚠️  WARNING: Content is less than 50% of target length!');
      }
      
      if (!totalContent.trim().startsWith('>')) {
        console.log('\n⚠️  WARNING: Content doesn\'t start with ">"!');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    console.log('='.repeat(60));
  }
  
  console.log('\n✅ All tests complete\n');
}

// Check if server is running
async function checkServer() {
  try {
    await fetch('http://localhost:3000');
    return true;
  } catch {
    console.error('❌ Dev server not running!');
    console.error('   Start it with: npm run dev\n');
    return false;
  }
}

async function main() {
  if (await checkServer()) {
    await testGeneration();
  }
}

main().catch(console.error);
