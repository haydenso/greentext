# Greentext Generator

A Next.js application that generates humorous greentext "be..." stories from Wikipedia biographies using Azure OpenAI's gpt-5-mini model.

## Features

- **Wikipedia Integration** - Paste any Wikipedia URL to generate a greentext
- **Style Options** - Choose between "normal" (concise) or "long" (detailed) styles
- **Flexible Character Limits**:
  - **Preset Mode** - Quick 240-character default
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
AZURE_OPENAI_BASE=https://hkust.azure-api.net
AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
AZURE_OPENAI_API_VERSION=2023-10-01
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Paste a Wikipedia URL (e.g., `https://en.wikipedia.org/wiki/Albert_Einstein`)
2. Choose your preferred style (normal or long)
3. Select character limit:
   - **Preset**: Quick 240-character default
   - **Custom**: Enter any value from 64 to 2,000 characters
4. Click "Generate!" to create your greentext
5. Copy the output using the "Copy" button

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
4. Builds prompt using `rubric.md` guidelines + style + character limit
5. Calls Azure OpenAI endpoint: `${BASE}/openai/deployments/${DEPLOYMENT}/chat/completions`
6. Returns greentext output to client (enforces character limit server-side)

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
