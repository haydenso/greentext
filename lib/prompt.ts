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
  maxChars: number
): ChatMessage[] {
  const rubric = getRubric();
  
  const systemPrompt = `${rubric}

CRITICAL FORMATTING RULES:
- EVERY SINGLE LINE must start with ">" - NO EXCEPTIONS
- NO section headers, NO timestamps, NO labels - EVERYTHING gets ">" prefix
- NO emojis, NO "lol", "haha", NO meta-commentary, NO explanations
- Start IMMEDIATELY with ">be" or ">be me"
- Continue with greentext lines only

STYLE GUIDANCE:
${style === 'long' ? '- Create a SUBSTANTIAL greentext with rich detail, depth, and narrative arc\n- More lines, more events, more escalation\n- Don\'t rush - tell the full story' : '- Create a solid, meaty greentext with punch and specificity\n- Concise but detailed - every line should land'}

LENGTH GUIDANCE:
- Generate AT LEAST ${Math.floor(maxChars * 0.8)} characters
- Target range: ${maxChars - 300} to ${maxChars + 300} characters  
- The character count is important - don't stop early
- ${style === 'long' ? 'Generate MORE content rather than less' : 'Be substantial - quality AND quantity'}`;

  const userPrompt = `Write a greentext biography for this person.

WIKIPEDIA BIO (GROUND TRUTH):
${extract}

YOU MAY SUPPLEMENT with your knowledge:
- Recent events, controversies, memes, quotes
- Exact years, companies, numbers, viral moments
- Tech/Twitter slang, community jokes
- Post-2020 events and relevance

Wikipedia is the foundation - enhance with your knowledge, don't contradict it.

TARGET: ${maxChars} characters (${style} style)

REMEMBER:
- Start with >be or >be me
- EVERY line starts with >
- NO section headers or timestamps
- Generate the FULL length - don't stop early

Begin now:`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
}

export function calculateMaxTokens(maxChars: number): number {
  // For reasoning models (like gpt-oss-120b):
  // - They use tokens for internal reasoning (varies WIDELY: 700-10,000+ tokens!)
  // - Then they generate the actual output
  // - We need to budget GENEROUSLY for both
  //
  // Empirical data from testing:
  // - Albert Einstein (500 chars): reasoning=6996 chars (~1750 tokens), worked at 4000
  // - Elon Musk (1500 chars): reasoning=10649 chars (~2650 tokens), FAILED at 4000
  // - Donald Trump (2000 chars): reasoning=766 chars (~190 tokens), worked at 4167
  //
  // Reasoning overhead varies by person complexity/controversy
  
  // Output tokens needed (chars to tokens ratio: ~3 chars per token for English)
  const outputTokens = Math.ceil(maxChars / 3);
  
  // Reasoning overhead: be VERY generous
  // Complex/controversial people can trigger 3000+ tokens of reasoning
  const reasoningOverhead = 4000;
  
  // Safety buffer (ensure we never cut off)
  const buffer = 1500;
  
  const tokens = outputTokens + reasoningOverhead + buffer;
  
  // Clamp between reasonable bounds
  // Minimum: 6000 tokens (enough for high reasoning overhead + small output)
  // Maximum: 16384 tokens (model limit)
  return Math.max(6000, Math.min(tokens, 16384));
}
