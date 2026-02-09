#!/usr/bin/env node

console.log('🧪 Simple Test - 1500 char request\n');

const testPayload = {
  url: 'https://en.wikipedia.org/wiki/Elon_Musk',
  maxChars: 1500,
  style: 'normal'
};

console.log('📤 Sending request:', testPayload);
console.log('⏳ Waiting for response...\n');

try {
  const response = await fetch('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload)
  });

  console.log('📥 Response status:', response.status);
  console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
  
  const contentType = response.headers.get('content-type');
  console.log('📝 Content-Type:', contentType);
  
  if (contentType?.includes('application/json')) {
    const data = await response.json();
    console.log('\n✅ JSON Response:');
    console.log('   Success:', data.success);
    console.log('   Greentext length:', data.greentext?.length || 0, 'chars');
    console.log('   Error:', data.error || 'none');
    
    if (data.greentext) {
      console.log('\n📄 Greentext output:');
      console.log('------------------------------------------------------------');
      console.log(data.greentext);
      console.log('------------------------------------------------------------');
      
      // Check formatting
      const lines = data.greentext.split('\n');
      const invalidLines = lines.filter(l => l.trim() && !l.trim().startsWith('>'));
      if (invalidLines.length > 0) {
        console.log('\n⚠️  Found', invalidLines.length, 'lines not starting with >:');
        invalidLines.slice(0, 3).forEach(line => console.log('   "' + line + '"'));
      } else {
        console.log('\n✅ All lines properly formatted with >');
      }
    }
  } else {
    const text = await response.text();
    console.log('\n📄 Raw response (first 500 chars):');
    console.log(text.substring(0, 500));
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n✅ Test complete. Check server logs at /tmp/nextjs-dev.log');
