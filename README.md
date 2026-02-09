# Greentext Generator

A Next.js application that generates humorous greentext "be..." stories from Wikipedia biographies using Azure OpenAI's **gpt-4.1-nano** model with real-time streaming.

## Features

- **Wikipedia Integration** - Paste any Wikipedia URL to generate a greentext
- **Real-time Streaming** - See your greentext appear as it's generated
- **Style Options** - Choose between "normal" or "long" styles
- **Flexible Character Limits**:
  - **Preset Mode** - Quick 1500-character default
  - **Custom Mode** - Set any length from 64 to 2,000 characters
- **Quick Examples** - One-click access to popular Wikipedia figures
- **Greentext Output** - Authentic 4chan-style formatting with ">" prefixes
- **Copy to Clipboard** - Easy sharing with one-click copy
- **Server-side Security** - API keys never exposed to client
- **Rate Limiting** - Built-in protection (10 requests/min per IP)
- **Comprehensive Tests** - 13 unit tests, all passing

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Azure OpenAI

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Azure OpenAI credentials:

```
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_BASE=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-nano
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

**Important Notes:**
- Use **standard chat models** (gpt-4.1-nano, gpt-4o, gpt-4o-mini) for best performance
- **Avoid reasoning models** (gpt-5-nano, o1-preview, o1-mini, gpt-oss-120b) - they are slower and token-inefficient for this use case
- The `AZURE_OPENAI_BASE` must end with a trailing slash `/`

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Paste a Wikipedia URL (e.g., `https://en.wikipedia.org/wiki/Albert_Einstein`)
2. Choose your preferred style (normal or long)
3. Select character limit:
   - **Preset**: Quick 1500-character default
   - **Custom**: Enter any value from 64 to 2,000 characters
4. Click "Generate!" to create your greentext
5. Watch as the greentext streams in real-time
6. Copy the output using the "Copy" button

## Project Structure

```
greentext/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # Server-side API endpoint
│   ├── components/
│   │   ├── InputForm.tsx          # URL input and options
│   │   └── GreentextDisplay.tsx   # Output display
│   ├── globals.css                # Styling (4chan-inspired)
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page
├── lib/
│   ├── wiki.ts                    # Wikipedia fetching logic
│   └── prompt.ts                  # Prompt building for LLM
├── rubric.md                      # Greentext generation rubric
├── AGENTS.md                      # Agent role definitions
└── .env.local.example             # Environment template
```

## Security

- API keys are stored in `.env.local` (git-ignored)
- All Azure OpenAI calls happen server-side
- URL validation ensures only Wikipedia domains
- Rate limiting: 10 requests per minute per IP
- Character limits enforced server-side (64-2000)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `AZURE_OPENAI_API_KEY`
   - `AZURE_OPENAI_BASE`
   - `AZURE_OPENAI_DEPLOYMENT`
   - `AZURE_OPENAI_API_VERSION`
4. Deploy

### Other Platforms

Ensure the platform supports:
- Next.js App Router
- Server-side functions (API routes)
- Environment variable configuration

## How It Works

1. User submits a Wikipedia URL
2. Server validates the URL (only `*.wikipedia.org`)
3. Fetches article summary via Wikipedia REST API (`/api/rest_v1/page/summary/`)
4. Builds optimized prompt with Wikipedia extract + style + character limit
5. Streams response from Azure OpenAI: `${BASE}openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${VERSION}`
6. Real-time SSE (Server-Sent Events) streaming to client
7. Returns formatted greentext output (enforces character limit server-side)

### Why gpt-4.1-nano?

We migrated from `gpt-oss-120b` (reasoning model) → `gpt-5-nano` (reasoning model) → **`gpt-4.1-nano` (standard chat model)**:

- **Reasoning models** (gpt-5-nano, o1-preview, gpt-oss-120b):
  - Use 100-5000+ "reasoning tokens" before output
  - Response times: 30-60+ seconds
  - Not suitable for real-time streaming
  
- **Standard models** (gpt-4.1-nano, gpt-4o):
  - 0 reasoning tokens - direct output
  - Response times: 3-4 seconds
  - Perfect for streaming
  - Token-efficient and cost-effective

## Testing

Run the comprehensive test suite:

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test files
pnpm test __tests__/wiki.test.ts
pnpm test __tests__/prompt.test.ts

# Integration tests
npx tsx test-api-logic.ts
```

**Test Results:** ✅ 13/13 tests passing

See [TESTING.md](./TESTING.md) for detailed test documentation.

## License

MIT
