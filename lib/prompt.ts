import fs from 'fs';
import path from 'path';

export type GreentextStyle = 'normal' | 'long';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

let rubricContent: string | null = null;

function getRubric(): string {
  if (!rubricContent) {
    const rubricPath = path.join(process.cwd(), 'rubric.md');
    rubricContent = fs.readFileSync(rubricPath, 'utf-8');
  }
  return rubricContent;
}

export function buildMessages(
  extract: string,
  style: GreentextStyle,
  maxChars: number,
  personName: string
): ChatMessage[] {
  // For reasoning models like gpt-5-nano, keep prompts CONCISE to reduce reasoning overhead
  // Long, detailed instructions cause excessive reasoning token usage
  
  const systemPrompt = `You write greentexts in /biz/ style.

Rules:
- Every line starts with ">" followed by the person's full name (e.g., ">${personName}")
- NO ">be me" or ">me when" - always use the actual person's name
- No headers, timestamps, or labels (except era markers like "2024-2026:")
- Funny, specific details
- Include numbers, dates, companies
- Modern slang and memes OK
- ${maxChars} chars target
- LAST 3-5 LINES MUST cover recent events (2024-2026): latest product launches, controversies, tweets, memes, market moves

Format: greentext only, no explanations.`;

  const userPrompt = `Write greentext bio for ${personName} (${maxChars} chars):

WIKIPEDIA SUMMARY (YOUR FOUNDATION):
${extract}

INSTRUCTIONS:
- Use Wikipedia as the foundation/ground truth
- Supplement with your knowledge of recent events (2024-2026) to make it funnier and more current
- Include specific: funding rounds, company names, exact years, controversies, viral moments
- CRITICAL: Last 3-5 lines MUST cover what ${personName} is doing NOW (2024-2026) - recent launches, controversies, tweets, market moves
- Wikipedia may be outdated since it was last updated, so use your knowledge of recent events to fill in what happened after

Start now with ">${personName}":`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
}

export function calculateMaxTokens(maxChars: number): number {
  // For gpt-4.1-nano (standard chat model, NOT a reasoning model):
  // No reasoning overhead - tokens are used directly for output
  // 
  // Token to character ratio: approximately 2.5-3 chars per token for English
  
  const outputTokens = Math.ceil(maxChars / 2.5);
  
  // Add modest buffer for safety
  const buffer = 200;
  
  const tokens = outputTokens + buffer;
  
  // Clamp between reasonable bounds
  // Minimum: 200 tokens
  // Maximum: 16000 tokens (gpt-4.1 has large context window)
  return Math.max(200, Math.min(tokens, 16000));
}
