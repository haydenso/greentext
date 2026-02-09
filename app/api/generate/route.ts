import { fetchWikipediaSummary } from '@/lib/wiki';
import { buildMessages, calculateMaxTokens } from '@/lib/prompt';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(req: Request) {
  const startTime = Date.now();
  
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
      { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const body = await req.json();
    const { url, style = 'normal', maxChars = 1500 } = body;

    // Validate inputs
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL provided' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Clamp maxChars to reasonable bounds
    const clampedMaxChars = Math.max(64, Math.min(maxChars || 1500, 2000));

    // Fetch Wikipedia summary
    const wikiStartTime = Date.now();
    const wiki = await fetchWikipediaSummary(url);
    const wikiDuration = Date.now() - wikiStartTime;
    console.log(`[PERF] Wikipedia fetch: ${wikiDuration}ms`);
    
    // Build prompt messages
    const promptStartTime = Date.now();
    const messages = buildMessages(wiki.extract, style, clampedMaxChars, wiki.title);
    const maxTokens = calculateMaxTokens(clampedMaxChars);
    const promptDuration = Date.now() - promptStartTime;
    console.log(`[PERF] Prompt building: ${promptDuration}ms`);
    console.log(`[CONFIG] Max tokens: ${maxTokens}, Target chars: ${clampedMaxChars}, Style: ${style}`);
    
    // Debug: Log prompt size
    const promptText = JSON.stringify(messages);
    console.log(`[DEBUG] Prompt size: ${promptText.length} chars, messages count: ${messages.length}`);
    console.log(`[DEBUG] System message length: ${messages[0]?.content?.length || 0} chars`);
    console.log(`[DEBUG] User message length: ${messages[1]?.content?.length || 0} chars`);

    // Call Azure OpenAI with streaming enabled
    // Using standard Azure OpenAI endpoint format (not Foundry Models)
    // gpt-4.1-nano is a standard chat model (not a reasoning model)
    const useStreaming = true; // Enable streaming for better UX
    const endpoint = `${process.env.AZURE_OPENAI_BASE}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION}`;

    const azureStartTime = Date.now();
    const azureResp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY || '',
      },
      body: JSON.stringify({
        messages,
        max_completion_tokens: maxTokens,
        stream: useStreaming,
        temperature: 0.8, // Higher temperature for more creative/funnier greentexts (0.7-0.9 recommended)
      }),
    });

    if (!azureResp.ok) {
      const text = await azureResp.text();
      console.error('Azure OpenAI error:', azureResp.status, text);
      return new Response(
        JSON.stringify({ success: false, error: `AI service error: ${azureResp.status}. Please try again later.` }),
        { 
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle non-streaming response (better for reasoning models)
    if (!useStreaming) {
      const data = await azureResp.json();
      const azureDuration = Date.now() - azureStartTime;
      
      // Extract content from response
      // Reasoning models may have content in different fields
      const choice = data?.choices?.[0];
      let content = choice?.message?.content || '';
      
      // Log what we received
      console.log(`[RESPONSE] finish_reason: ${choice?.finish_reason}`);
      console.log(`[RESPONSE] content length: ${content.length} chars`);
      
      if (choice?.message?.reasoning_content) {
        console.log(`[RESPONSE] reasoning_content length: ${choice.message.reasoning_content.length} chars`);
      }
      
      const totalDuration = Date.now() - startTime;
      console.log(`[PERF] Azure OpenAI call: ${azureDuration}ms`);
      console.log(`[PERF] Total request time: ${totalDuration}ms`);
      console.log(`[PERF] Breakdown - Wiki: ${wikiDuration}ms (${((wikiDuration/totalDuration)*100).toFixed(1)}%), Azure: ${azureDuration}ms (${((azureDuration/totalDuration)*100).toFixed(1)}%)`);
      
      // Check if output exceeds maxChars
      if (content.length > clampedMaxChars) {
        content = content.substring(0, clampedMaxChars - 3) + '...';
      }
      
      return new Response(
        JSON.stringify({ success: true, greentext: content }),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle streaming response
    const encoder = new TextEncoder();
    let fullContent = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = azureResp.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Send final stats
              const azureDuration = Date.now() - azureStartTime;
              const totalDuration = Date.now() - startTime;
              console.log(`[PERF] Azure OpenAI streaming completed: ${azureDuration}ms`);
              console.log(`[PERF] Total request time: ${totalDuration}ms`);
              console.log(`[PERF] Total content length: ${fullContent.length} chars`);
              console.log(`[PERF] Breakdown - Wiki: ${wikiDuration}ms (${((wikiDuration/totalDuration)*100).toFixed(1)}%), Azure: ${azureDuration}ms (${((azureDuration/totalDuration)*100).toFixed(1)}%)`);
              
              controller.close();
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
                  
                  // Debug: Log the first few data chunks to see structure
                  if (fullContent.length === 0) {
                    console.log('[DEBUG] First stream chunk:', JSON.stringify(data, null, 2));
                  }
                  
                  // Extract content delta from the stream
                  const choice = data?.choices?.[0];
                  const delta = choice?.delta?.content || '';
                  
                  // Log first real content chunk
                  if (delta && fullContent.length === 0) {
                    console.log('[STREAM] First content chunk received');
                  }
                  
                  if (delta) {
                    fullContent += delta;
                    
                    // Stream all content to client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                    
                    // Log progress every 200 chars
                    if (fullContent.length % 200 < delta.length) {
                      console.log(`[STREAM] Content length: ${fullContent.length} chars`);
                    }
                  }
                } catch (e) {
                  console.error('Error parsing stream chunk:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('Generate error:', err);
    const totalDuration = Date.now() - startTime;
    console.log(`[PERF] Failed request time: ${totalDuration}ms`);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Unknown error occurred' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
