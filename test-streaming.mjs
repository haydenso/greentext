#!/usr/bin/env node

/**
 * Quick test script to verify streaming is working
 * Run with: node test-streaming.mjs
 * 
 * Make sure dev server is running: npm run dev
 */

async function testStreaming() {
  console.log('🧪 Testing Greentext Streaming...\n');
  
  const testUrl = 'https://en.wikipedia.org/wiki/Elon_Musk';
  const maxChars = 800;
  
  console.log(`📝 Test URL: ${testUrl}`);
  console.log(`📏 Max chars: ${maxChars}`);
  console.log(`🚀 Starting request...\n`);
  
  const startTime = Date.now();
  let firstChunkTime = 0;
  let chunkCount = 0;
  let totalContent = '';
  
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
    
    if (!response.ok) {
      console.error('❌ Request failed:', response.status);
      const data = await response.json();
      console.error('Error:', data.error);
      return;
    }
    
    const contentType = response.headers.get('content-type');
    console.log(`📡 Content-Type: ${contentType}\n`);
    
    if (!contentType?.includes('text/event-stream')) {
      console.log('⚠️  Not a streaming response, falling back to JSON');
      const data = await response.json();
      console.log('Result:', data.greentext);
      return;
    }
    
    console.log('✅ Streaming response detected!\n');
    console.log('📥 Receiving chunks:\n');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
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
                console.log(`⚡ First chunk received in ${firstChunkTime}ms!`);
                console.log(`📝 Content preview: "${data.content.substring(0, 50)}..."\n`);
              }
              
              // Show progress every 10 chunks
              if (chunkCount % 10 === 0) {
                console.log(`   Chunk ${chunkCount}: ${totalContent.length} chars`);
              }
            }
          } catch (e) {
            console.error('❌ Parse error:', e.message);
          }
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 STREAMING TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Total chunks received: ${chunkCount}`);
    console.log(`⚡ Time to first chunk: ${firstChunkTime}ms`);
    console.log(`⏱️  Total streaming time: ${totalTime}ms`);
    console.log(`📏 Total characters: ${totalContent.length}`);
    console.log(`📈 Average chunk size: ${(totalContent.length / chunkCount).toFixed(1)} chars`);
    console.log(`🚀 Streaming rate: ${(chunkCount / (totalTime / 1000)).toFixed(1)} chunks/sec`);
    console.log('='.repeat(60));
    
    console.log('\n📄 GENERATED GREENTEXT:\n');
    console.log(totalContent);
    console.log('\n✅ Test completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n⚠️  Make sure the dev server is running:');
    console.error('   npm run dev\n');
  }
}

// Run test
testStreaming().catch(console.error);
