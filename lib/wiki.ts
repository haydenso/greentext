export async function fetchWikipediaSummary(url: string): Promise<{ title: string; extract: string }> {
  const u = new URL(url);
  if (!u.hostname.endsWith('wikipedia.org')) {
    throw new Error('Only wikipedia.org URLs allowed');
  }
  
  // title is everything after the first '/wiki/' segment
  const match = u.pathname.match(/\/wiki\/(.+)/);
  if (!match) {
    throw new Error('Invalid wikipedia article URL');
  }
  
  const title = decodeURIComponent(match[1]);
  const api = `https://${u.hostname}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  
  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const res = await fetch(api, { 
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'GreentextGenerator/1.0' // Be a good citizen
      },
      cache: 'force-cache', // Enable caching for better performance
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Article not found');
      }
      throw new Error(`Wikipedia fetch failed: ${res.status}`);
    }
    
    const json = await res.json();
    return { 
      title: json.title || 'Unknown', 
      extract: json.extract || '' 
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Wikipedia request timed out. Please try again.');
    }
    throw error;
  }
}
