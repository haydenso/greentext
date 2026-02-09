# AGENTS.md

Purpose
- Define small agents (roles) and execution recipes to implement a lightweight Next.js TypeScript app that:
  - Accepts a Wikipedia URL
  - Fetches the bio/summary
  - Builds a greentext prompt (rubric.md) and calls Azure OpenAI (gpt-5-mini) via the Azure OpenAI chat completions endpoint
  - Returns greentext limited by a max-char setting and style option (normal|long)

Conventions / Environment
- Project: Next.js (App Router), TypeScript.
- Secrets (server-only, do NOT expose to client):
  - `AZURE_OPENAI_API_KEY`
  - `AZURE_OPENAI_BASE` e.g. `https://hkust.azure-api.net`
  - `AZURE_OPENAI_DEPLOYMENT` = `gpt-5-mini`
  - `AZURE_OPENAI_API_VERSION` = `2023-10-01`
- Put secrets in `.env.local` (and add to `.gitignore`).
- Files referenced use workspace-relative paths.
- Default maxChars: 1500 (range: 64-2000)

Agent Roles
1. explore
   - Purpose: inspect repo (look for `index.html`, `rubric.md`) and surface constraints.
   - Inputs: none
   - Outputs: list of files to port and style rules to preserve (`index.html`, CSS), `rubric.md` contents.
   - Implementation notes: read only.

2. scaffold
   - Purpose: create Next.js app skeleton and TypeScript files that mirror `index.html` UI and style.
   - Inputs: output from `explore`
   - Outputs: files to create (list below)
   - Files to create:
     - `app/page.tsx`
     - `app/components/InputForm.tsx`
     - `app/components/GreentextDisplay.tsx`
     - `app/globals.css` (or inline CSS in `page.tsx` using existing CSS)
     - `app/api/generate/route.ts`
     - `lib/wiki.ts`
     - `lib/prompt.ts`
     - `rubric.md` (ensure it exists and is used)
   - Primary tasks:
     - Port `index.html` markup and CSS to `app/page.tsx` and `globals.css`.
     - Wire `InputForm` to call `POST /api/generate` with body: `{ url, style, maxChars }`.

3. fetcher
   - Purpose: robustly fetch Wikipedia summary for a validated wikipedia URL.
   - Inputs: Wikipedia URL
   - Outputs: `{ title, extract }` or errors
   - Constraints: only accept host `*.wikipedia.org`.
   - Implementation hint: use Wikipedia REST: `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`.

4. prompt-builder
   - Purpose: merge `rubric.md` with the wikipedia extract and options to produce the chat messages for the LLM.
   - Inputs: `{ extract, style, maxChars }`, `rubric.md`
   - Outputs: array of chat `messages` and `max_tokens` for model call.
   - Token mapping (guideline): `maxTokens = clamp(Math.ceil(maxChars / 4) + 32, 64, 2048)`

5. azure-call
   - Purpose: call Azure OpenAI chat completions endpoint server-side and return the top choice.
   - Inputs: `messages`, `maxTokens`
   - Outputs: greentext string
   - Endpoint format:
     ```
     ${AZURE_OPENAI_BASE}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}
     ```
   - Headers: set `Content-Type: application/json` and `api-key: ${AZURE_OPENAI_API_KEY}`.

6. test-runner
   - Purpose: run unit tests for:
     - URL validation
     - wiki fetch parsing
     - prompt-builder output shapes
     - API route end-to-end mock (mock fetch to Azure)
   - Test commands: `pnpm test` or `npm test` depending on package manager.

7. deployer
   - Purpose: package and deploy (Vercel recommended) ensuring env vars are set in host secret store.
   - Inputs: built project
   - Outputs: deployment URL
   - Notes: ensure server functions supported.

API Contract (`app/api/generate/route.ts`)
- Endpoint: `POST /api/generate`
- Body:
  ```ts
  {
    url: string,
    style?: "normal" | "long", // default "normal"
    maxChars?: number // default 1500, range 64-2000
  }
  ```
- Response success:
  ```ts
  { success: true, greentext: string }
  ```
- Response error:
  ```ts
  { success: false, error: string }
  ```

Security & Abuse Mitigation
- Validate URL host `*.wikipedia.org`; reject others.
- Enforce `maxChars` range: 64..2000 (server clamp).
- Rate-limit per-IP (simple in-memory counter or middleware).
- Never include API key in client bundle.

Sample TypeScript snippets (for implementers)
- `lib/wiki.ts` (fetch summary)
```ts
export async function fetchWikipediaSummary(url: string) {
  const u = new URL(url);
  if (!u.hostname.endsWith('wikipedia.org')) throw new Error('Only wikipedia.org URLs allowed');
  // title is everything after the first '/wiki/' segment
  const match = u.pathname.match(/\/wiki\/(.+)/);
  if (!match) throw new Error('Invalid wikipedia article URL');
  const title = decodeURIComponent(match[1]);
  const api = `https://${u.hostname}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(api, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Wikipedia fetch failed: ${res.status}`);
  const json = await res.json();
  return { title: json.title, extract: json.extract || '' };
}
```

- `app/api/generate/route.ts` (core Azure call and flow)
```ts
import { NextResponse } from 'next/server';
import { fetchWikipediaSummary } from '../../../lib/wiki';
import { buildMessages } from '../../../lib/prompt';

export async function POST(req: Request) {
  const body = await req.json();
  const { url, style = 'normal', maxChars = 1500 } = body;

  try {
    const wiki = await fetchWikipediaSummary(url);
    const messages = buildMessages(wiki.extract, style, maxChars);
    const maxTokens = Math.min(Math.ceil(maxChars / 4) + 32, 2048);

    const endpoint = `${process.env.AZURE_OPENAI_BASE}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION}`;

    const azureResp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.AZURE_OPENAI_API_KEY || '',
      },
      body: JSON.stringify({
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!azureResp.ok) {
      const text = await azureResp.text();
      return NextResponse.json({ success: false, error: `Azure error: ${azureResp.status} ${text}` }, { status: 502 });
    }

    const data = await azureResp.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return NextResponse.json({ success: true, greentext: content });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 400 });
  }
}
```

Prompt building (lib/prompt.ts) — high level
- System message: copy `rubric.md` instructions verbatim, add formatting constraints:
  - "Every line MUST start with `>` and not exceed X characters in total."
  - "NO emojis, NO meta-commentary. Start IMMEDIATELY with greentext."
- User message: include the wiki `extract` as GROUND TRUTH foundation:
  ```
  Write a greentext bio for the person described below.

  WIKIPEDIA BIO (GROUND TRUTH - use as foundation):
  {extract}

  YOU MAY SUPPLEMENT with your knowledge of this person to make the greentext funnier and more specific:
  - Recent events, controversies, memes, quotes
  - Exact years, funding rounds, company names, viral moments
  - Tech/Twitter slang, current community jokes
  - Post-2020 relevance where applicable

  BUT: Wikipedia is the GROUND TRUTH. Don't contradict it. Use your knowledge to ENHANCE and HEIGHTEN, not replace.
  ```
- Return `messages` array for `azure-call`.

UI specifics (client)
- `InputForm` should:
  - Validate URL client-side for `wikipedia.org`.
  - Provide default `maxChars = 1500`.
  - Provide radio `normal | long`.
  - Example quick-links: list of top 10 popular Wikipedia people as clickable examples (store array in `app/page.tsx`).
- `GreentextDisplay`:
  - Use monospace font, light green background, preserve newlines.
  - Provide copy button and a character count.

Testing
- Unit tests for:
  - `fetchWikipediaSummary` with known article URLs (mock fetch).
  - `buildMessages` returns expected message array, and max token mapping.
  - `route` end-to-end: mock wiki and azure fetch and assert JSON response shape.
- Integration test:
  - Simulate form post and validate greentext returned and length constraint enforced.

Failure modes & recovery
- Wikipedia 404: show friendly error "Article not found".
- Azure error (429/500): show "Try again later" and capture server logs.
- Output too long despite tokens: enforce server-side substring to `maxChars` and append ellipsis.

Deployment checklist
1. Ensure `.env` variables are configured on host: `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_BASE`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`.
2. Use Vercel or an environment supporting Next.js server functions.
3. Run `pnpm build` then `pnpm start` (or host specific).
4. Smoke test with a known wiki URL (e.g., `https://en.wikipedia.org/wiki/Albert_Einstein`) and `maxChars=1500`.

Operational notes for maintainers
- If you change the LLM deployment, update `AZURE_OPENAI_DEPLOYMENT`.
- When generating outputs, consider adding a short provenance line in logs to help debug hallucinations (do not log full secrets).
- If you need streaming responses: replace chat completions call with streaming-compatible call and stream to client via SSE/edge functions.

Appendix: example env (.env.local)
```
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_BASE=https://hkust.azure-api.net
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
AZURE_OPENAI_API_VERSION=2023-10-01
```
