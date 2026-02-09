#!/usr/bin/env node

console.log('🧪 Streaming Test - gpt-5-nano\n');

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
    const startTime = Date.now();
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test)
    });

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('text/event-stream')) {
      console.log('✅ Received streaming response');
      
      let fullContent = '';
      let chunkCount = 0;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                chunkCount++;
                
                // Show progress every 10 chunks
                if (chunkCount % 10 === 0) {
                  process.stdout.write(`\r   Progress: ${fullContent.length} chars (${chunkCount} chunks)`);
                }
              }
            } catch (e) {
              // Ignore parse errors for non-JSON lines
            }
          }
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ Streaming complete in ${duration}ms`);
      console.log(`   Total: ${fullContent.length} chars, ${chunkCount} chunks`);
      
      const lines = fullContent.split('\n').filter(l => l.trim());
      const invalidLines = lines.filter(l => !l.trim().startsWith('>'));
      
      if (invalidLines.length > 0) {
        console.log(`⚠️  Found ${invalidLines.length} lines not starting with >`);
        invalidLines.slice(0, 3).forEach(line => console.log(`   "${line}"`));
      } else {
        console.log(`✅ All ${lines.length} lines properly formatted with >`);
      }
      
      console.log(`\n📄 First 200 chars:\n${fullContent.substring(0, 200)}...`);
      
    } else if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log('⚠️  Received JSON response (non-streaming)');
      console.log(`   Success: ${data.success}`);
      console.log(`   Length: ${data.greentext?.length || 0} chars`);
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
    } else {
      console.log(`❌ Unexpected content type: ${contentType}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
}

console.log('\n' + '='.repeat(60));
console.log('✅ All tests complete');
console.log('📊 Check server logs at /tmp/nextjs-dev.log for detailed performance data');
