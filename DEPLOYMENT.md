# Deployment Checklist

This document provides a comprehensive deployment checklist for the Greentext Generator.

## Pre-Deployment Checklist

### 1. Environment Variables ✅

Ensure all required environment variables are configured on your hosting platform:

```bash
AZURE_OPENAI_API_KEY=your-actual-api-key
AZURE_OPENAI_BASE=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-nano
AZURE_OPENAI_API_VERSION=2025-01-01-preview
```

**Important:**
- ❌ **NEVER** commit `.env.local` to git
- ✅ `.env.local` is in `.gitignore`
- ✅ Use `.env.local.example` as template
- ✅ Set environment variables in hosting platform's dashboard

### 2. Security Verification ✅

- ✅ API keys are server-side only (never exposed to client)
- ✅ `.env.local` is git-ignored
- ✅ No hardcoded secrets in codebase
- ✅ URL validation enforces `*.wikipedia.org` only
- ✅ Character limits enforced server-side (64-2000)
- ✅ Rate limiting implemented (10 req/min per IP)

### 3. Model Selection ✅

**Current Model:** `gpt-4.1-nano` (standard chat model)

**Recommended Models:**
- ✅ `gpt-4.1-nano` - Fast, token-efficient, streaming-capable (current)
- ✅ `gpt-4o` - More capable, slightly higher cost
- ✅ `gpt-4o-mini` - Even faster, lower cost

**Avoid These Models for This App:**
- ❌ `gpt-5-nano` - Reasoning model (30-60s response times)
- ❌ `o1-preview` - Reasoning model (very slow)
- ❌ `o1-mini` - Reasoning model (slow)
- ❌ `gpt-oss-120b` - Reasoning model (10-15s response times)

**Why?** Reasoning models use 100-5000+ reasoning tokens before generating output, making them unsuitable for real-time streaming applications.

### 4. Build & Test ✅

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Verify all tests pass
# Expected: 13/13 tests passing

# Build the application
npm run build

# Test production build locally
npm start
```

### 5. Smoke Test

Test with a known Wikipedia URL:

```bash
# Start dev server
npm run dev

# Test in browser:
# URL: https://en.wikipedia.org/wiki/Albert_Einstein
# Style: Normal
# Length: 1500 chars
# Expected: Greentext streams in 3-4 seconds
```

## Deployment Platforms

### Vercel (Recommended)

**Why Vercel?**
- ✅ Built for Next.js (same team)
- ✅ Automatic deployments from git
- ✅ Environment variable management
- ✅ Edge functions support
- ✅ Free tier available

**Steps:**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure project settings (use defaults)

3. **Add Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Add all 4 variables from `.env.local`:
     - `AZURE_OPENAI_API_KEY`
     - `AZURE_OPENAI_BASE`
     - `AZURE_OPENAI_DEPLOYMENT`
     - `AZURE_OPENAI_API_VERSION`
   - Make sure to add them for all environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Test your deployment URL

5. **Verify Deployment**
   - Visit your Vercel URL
   - Test with Einstein example
   - Verify streaming works
   - Check browser console for errors

### Alternative Platforms

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod
```

**Environment Variables:**
- Add in Netlify dashboard → Site settings → Environment variables

#### Railway

- Import from GitHub
- Add environment variables in dashboard
- Railway auto-detects Next.js and configures build

#### Cloudflare Pages

- Connect GitHub repository
- Build command: `npm run build`
- Output directory: `.next`
- Add environment variables in settings

## Post-Deployment Checklist

### 1. Functionality Tests

- [ ] Homepage loads correctly
- [ ] Input form is functional
- [ ] Example links work
- [ ] Wikipedia URL validation works
- [ ] Greentext generation works
- [ ] Streaming displays in real-time
- [ ] Copy button works
- [ ] Error handling works (test with invalid URL)

### 2. Performance Tests

- [ ] Initial load time < 2s
- [ ] Generation time 3-5s (for standard models)
- [ ] Streaming starts within 1s
- [ ] No console errors
- [ ] Mobile responsive

### 3. Security Verification

- [ ] View page source - no API keys visible
- [ ] Check network tab - API calls go to `/api/generate` (not directly to Azure)
- [ ] Test invalid Wikipedia domain - should reject
- [ ] Test character limit boundaries (64, 2000, 2001)

### 4. Monitoring Setup

**Vercel Analytics** (if using Vercel):
- Enable in Vercel dashboard
- Monitor response times
- Track error rates

**Custom Logging:**
- Check deployment logs for errors
- Monitor Azure OpenAI usage/costs
- Set up alerts for high usage

## Rollback Plan

If deployment fails:

1. **Vercel:** Use "Redeploy" with previous deployment from dashboard
2. **Check Logs:** Vercel dashboard → Deployments → Select deployment → Logs
3. **Common Issues:**
   - Missing environment variables → Add in dashboard
   - Build errors → Check Next.js version compatibility
   - API errors → Verify Azure OpenAI credentials

## Cost Estimation

**Azure OpenAI (gpt-4.1-nano):**
- ~1000 tokens per request (with streaming)
- Pricing: Check [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/)

**Hosting (Vercel Free Tier):**
- 100GB bandwidth/month
- Unlimited requests
- Should be sufficient for personal/demo use

**Estimate for 1000 requests/month:**
- Azure: ~$0.50-2.00 (depends on token pricing)
- Vercel: Free (within limits)

## Troubleshooting

### Issue: "API key invalid"
- **Fix:** Verify `AZURE_OPENAI_API_KEY` in environment variables
- **Check:** Key should be 88 characters long

### Issue: "Deployment not found"
- **Fix:** Verify `AZURE_OPENAI_DEPLOYMENT` matches your Azure deployment name
- **Check:** Must be exact match (case-sensitive)

### Issue: "Network timeout"
- **Fix:** Check `AZURE_OPENAI_BASE` URL format
- **Must:** End with trailing slash `/`
- **Format:** `https://your-resource.openai.azure.com/`

### Issue: Slow response times
- **Check:** Are you using a reasoning model? (gpt-5-nano, o1-preview)
- **Fix:** Switch to standard model (gpt-4.1-nano, gpt-4o)

### Issue: No streaming
- **Check:** Browser console for errors
- **Check:** Server logs for streaming errors
- **Fix:** Ensure `useStreaming = true` in `route.ts:76`

## Production Optimizations

### Optional Enhancements

1. **Caching** (for popular pages)
   ```typescript
   // Add Redis/KV cache for Wikipedia fetches
   const cached = await kv.get(`wiki:${url}`);
   if (cached) return cached;
   ```

2. **Analytics**
   ```typescript
   // Track popular Wikipedia pages
   // Monitor generation times
   // Track error rates
   ```

3. **Rate Limiting Enhancement**
   ```typescript
   // Use Redis for distributed rate limiting
   // Current: In-memory (resets on deploy)
   ```

4. **Temperature Control**
   ```typescript
   // gpt-4.1-nano supports temperature
   // Add slider in UI for creativity control
   // Range: 0.7-0.9 recommended
   ```

5. **A/B Testing**
   - Test different prompt variations
   - Measure user engagement
   - Optimize for quality vs. speed

## Success Criteria

Deployment is successful when:

- ✅ All 13 unit tests pass
- ✅ Smoke test with Einstein passes
- ✅ Response time 3-5 seconds
- ✅ Streaming works in real-time
- ✅ No API keys in client bundle
- ✅ Mobile responsive
- ✅ No console errors
- ✅ Error handling works

## Support

For issues:
1. Check deployment logs
2. Verify environment variables
3. Test locally with `npm run build && npm start`
4. Review [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
5. Review [Azure OpenAI Docs](https://learn.microsoft.com/en-us/azure/ai-services/openai/)

---

**Last Updated:** 2026-02-09
**Model:** gpt-4.1-nano
**Next.js Version:** 15.1.0
