// Vercel Serverless Function: Live Multi-Source RSS News Aggregator
// Fetches and parses live RSS feeds (zero external dependencies) sorted newest-first.

interface RssFeedSource {
  source: string;
  category: string;
  url: string;
}

const RSS_FEEDS: RssFeedSource[] = [
  { source: 'The Hindu', category: 'India', url: 'https://www.thehindu.com/news/national/feeder/default.rss' },
  { source: 'The Hindu TN', category: 'Local', url: 'https://www.thehindu.com/news/cities/chennai/feeder/default.rss' },
  { source: 'NDTV', category: 'India', url: 'https://feeds.feedburner.com/ndtvnews-top-stories' },
  { source: 'Times of India', category: 'National', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
  { source: 'TechCrunch', category: 'Technology', url: 'https://techcrunch.com/feed/' },
  { source: 'BBC News', category: 'World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { source: 'Al Jazeera', category: 'World', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { source: 'BBC Sport', category: 'Sports', url: 'https://feeds.bbci.co.uk/sport/rss.xml' },
];

export interface LiveNewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  published_at: string;
  fetched_at: string;
  image_url?: string;
}

function decodeXmlEntities(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1]) : '';
}

function extractImageUrl(block: string): string | undefined {
  const mediaMatch = block.match(/<(?:media:content|media:thumbnail|enclosure)[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch?.[1]) return mediaMatch[1];
  const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch?.[1];
}

function parseRssItems(xml: string, feed: RssFeedSource, fetchedAt: string): LiveNewsArticle[] {
  const items: LiveNewsArticle[] = [];
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  for (const block of itemMatches.slice(0, 15)) {
    const title = extractTag(block, 'title');
    const url = extractTag(block, 'link') || extractTag(block, 'guid');
    if (!title || !url) continue;

    const description = extractTag(block, 'description') || extractTag(block, 'summary') || title;
    const pubRaw = extractTag(block, 'pubDate') || extractTag(block, 'dc:date') || fetchedAt;
    const parsedTime = Date.parse(pubRaw);
    const publishedAt = Number.isNaN(parsedTime) ? fetchedAt : new Date(parsedTime).toISOString();

    items.push({
      id: `rss-${feed.source.toLowerCase().replace(/\s+/g, '-')}-${Buffer.from(url).toString('base64').slice(0, 16)}`,
      title,
      description: description.slice(0, 260),
      url,
      source: feed.source,
      category: feed.category,
      published_at: publishedAt,
      fetched_at: fetchedAt,
      image_url: extractImageUrl(block),
    });
  }

  return items;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const categoryFilter = String(req.query?.category || '').trim().toLowerCase();
  const queryFilter = String(req.query?.q || req.query?.search || '').trim().toLowerCase();
  const fetchedAt = new Date().toISOString();

  const targetFeeds =
    categoryFilter && categoryFilter !== 'all' && categoryFilter !== 'home' && categoryFilter !== 'for you'
      ? RSS_FEEDS.filter((f) => f.category.toLowerCase() === categoryFilter)
      : RSS_FEEDS;

  const feedsToFetch = targetFeeds.length > 0 ? targetFeeds : RSS_FEEDS;

  const settled = await Promise.allSettled(
    feedsToFetch.map(async (feed) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LifeOS-News/2.0)',
            Accept: 'application/rss+xml, application/xml, text/xml',
          },
        });
        if (!response.ok) return [];
        const xml = await response.text();
        return parseRssItems(xml, feed, fetchedAt);
      } catch {
        return [];
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const seenTitles = new Set<string>();
  const combined: LiveNewsArticle[] = [];

  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    for (const article of result.value) {
      const key = article.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 60);
      if (!key || seenTitles.has(key)) continue;
      if (queryFilter) {
        const haystack = `${article.title} ${article.description} ${article.source}`.toLowerCase();
        if (!haystack.includes(queryFilter)) continue;
      }
      seenTitles.add(key);
      combined.push(article);
    }
  }

  combined.sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));

  return res.status(200).json({
    count: combined.length,
    fetchedAt,
    articles: combined.slice(0, 80),
  });
}
