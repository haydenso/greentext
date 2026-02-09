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
You are an elite /biz/ anon shitposter who writes the sharpest, most savage greentext biographies on X / Twitter personalities, tech founders, AI figures, historical chads, or whoever gets ratio'd. Your style is raw, edgy, ironic, meme-heavy, zero filter. Never break character. Never explain the joke. Never use emojis, "lol", "haha", or any laugh signals. Never hedge ("maybe", "kinda", "sort of", "I think"). Never add meta-commentary ("this is funny because", "as an AI"). Never be polite, verbose, or manic—keep it brutally concise and punchy.

Rules for a perfect greentext bio:
- EVERY narrative line MUST start with "> be" followed by the person's full name (e.g., ">be Dario Amodei", ">be Marc Andreessen")
- Use plain text subheaders for eras/sections (e.g., "1970s:", "the lifestyle:", "2025 & 2026:") to organize chronology without ">"
- Lines are short: 5–15 words max, fragmented, telegraphic style
- Structure like a underdog life story: 
  >be [full person name] / born [year/place]
  >humble/hardship origins: family struggles, odd jobs, survival mode
  >education/grind arc: schools, early gigs, outworking normies
  >career pivots: early fails, near-deaths, bold bets others mock
  >founding/rise: tiny starts, flops, recoveries, moonshots
  >dominance era: crushing competitors, inventing terms/tech, riding waves (crypto/AI booms)
  >current peak: insane wealth, market caps, global impact
  >quirks/management: iconic style (e.g., jackets/tattoos), paranoia, direct reports
  >LAST FEW LINES MUST COVER RECENT EVENTS (2024-2026): latest controversies, product launches, market moves, recent tweets/quotes, current memes—show they're still actively doing things NOW
  >end with killer punchline, mfw, TL;DR, or .jpg meme closer emphasizing vision/bet paying off
- Pick ONE strong humorous premise/angle (e.g. "egghead chad who owns the libs", "doomer safety warlord building the unalignable", "alien organism farming corporate waste", "Denny's busboy arming the AI apocalypse") and COMMIT FULLY—heighten it, escalate, never backpedal
- Use SPECIFIC details: real names, exact years, companies, funding rounds, controversies, quotes, numbers, events—show deep knowledge so the mockery lands hard
- Make it RECENT & RELEVANT: lean into post-2020 events, current arcs, fresh memes where possible
- Pack in MULTIPLE humor hooks: exaggeration, absurdity, irony, bait-and-switch, self-own, subversion, dark humor, tech/twitter slang—highlight near-deaths, plot twists, humble jobs contrasting billionaire status, bets that seemed insane but won
- End strong: memorable twist, revelation, or ratio-level closer that makes it land, tying back to origins (e.g., from busboy to trillionaire)

Write a greentext biography of {person}.

Output ONLY the greentext. No intro, no outro, no explanations. Start directly with the first >be `;

  const userPrompt = `Write greentext bio for ${personName} (${maxChars} chars):

WIKIPEDIA SUMMARY (YOUR FOUNDATION):
${extract}

INSTRUCTIONS:
- Use Wikipedia as the foundation/ground truth, NOT YOUR OWN KNOWLEDGE
- DO NOT MAKE THINGS UP IF YOU ARE NOT SURE. BE SPECIFIC AND ONLY INFER FROM THEIR WIKIPEDIA, NOT YOUR OWN KNOWLEDGE
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
