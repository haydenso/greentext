import { describe, it, expect } from 'vitest';
import { fetchWikipediaSummary } from '../lib/wiki';

describe('Wikipedia Fetching', () => {
  it('should fetch a valid Wikipedia article', async () => {
    const result = await fetchWikipediaSummary('https://en.wikipedia.org/wiki/Albert_Einstein');
    
    expect(result.title).toBe('Albert Einstein');
    expect(result.extract).toBeTruthy();
    expect(result.extract.length).toBeGreaterThan(0);
  });

  it('should reject non-Wikipedia URLs', async () => {
    await expect(
      fetchWikipediaSummary('https://google.com')
    ).rejects.toThrow('Only wikipedia.org URLs allowed');
  });

  it('should reject invalid Wikipedia URLs', async () => {
    await expect(
      fetchWikipediaSummary('https://en.wikipedia.org/wiki/')
    ).rejects.toThrow('Invalid wikipedia article URL');
  });

  it('should reject malformed URLs', async () => {
    await expect(
      fetchWikipediaSummary('not-a-url')
    ).rejects.toThrow();
  });

  it('should handle 404 errors gracefully', async () => {
    await expect(
      fetchWikipediaSummary('https://en.wikipedia.org/wiki/ThisArticleDoesNotExist123456789')
    ).rejects.toThrow('Article not found');
  });
});
