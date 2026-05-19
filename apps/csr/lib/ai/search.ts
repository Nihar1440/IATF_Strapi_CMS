export async function performWebSearch(query: string): Promise<string> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!res.ok) return ''

    const html = await res.text()
    
    // Extract snippets from DuckDuckGo Lite HTML results
    const snippetRegex = /<a class="result__snippet[^>]*>(.*?)<\/a>/gi
    const snippets: string[] = []
    
    let match
    while ((match = snippetRegex.exec(html)) !== null) {
      // Clean HTML tags and decode HTML entities manually
      const clean = match[1]
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()
        
      if (clean) {
        snippets.push(clean)
      }
      if (snippets.length >= 8) break // Take up to 8 top snippets
    }

    return snippets.join('\n')
  } catch (err) {
    console.error('[WebSearch] Failed to fetch search results:', err)
    return ''
  }
}
