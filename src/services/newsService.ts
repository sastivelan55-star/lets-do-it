// Life OS Official News Provider Integration
// Uses official public developer APIs: Hacker News Firebase API & Dev.to Official REST API
import type { NewsArticle } from '../types';

const CACHE_KEY = 'life_os_news_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache to respect API terms and rate limits

interface CachedNews {
  timestamp: number;
  articles: NewsArticle[];
}

export async function fetchNewsArticles(forceRefresh = false): Promise<{ articles: NewsArticle[]; lastUpdated: string; fromCache: boolean }> {
  // Check local cache if not force refresh
  if (!forceRefresh) {
    try {
      const cachedStr = localStorage.getItem(CACHE_KEY);
      if (cachedStr) {
        const cached: CachedNews = JSON.parse(cachedStr);
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_TTL_MS && Array.isArray(cached.articles) && cached.articles.length > 0) {
          return {
            articles: cached.articles,
            lastUpdated: new Date(cached.timestamp).toLocaleTimeString(),
            fromCache: true,
          };
        }
      }
    } catch {
      // Cache read error ignored
    }
  }

  // Fetch from official Dev.to API and Hacker News API concurrently
  const [devToRes, hnRes] = await Promise.allSettled([
    fetchDevToArticles(),
    fetchHackerNewsArticles(),
  ]);

  const combined: NewsArticle[] = [];

  if (devToRes.status === 'fulfilled' && devToRes.value.length > 0) {
    combined.push(...devToRes.value);
  }
  if (hnRes.status === 'fulfilled' && hnRes.value.length > 0) {
    combined.push(...hnRes.value);
  }

  // If both failed, try returning stale cache before throwing
  if (combined.length === 0) {
    try {
      const cachedStr = localStorage.getItem(CACHE_KEY);
      if (cachedStr) {
        const cached: CachedNews = JSON.parse(cachedStr);
        if (cached.articles && cached.articles.length > 0) {
          return {
            articles: cached.articles,
            lastUpdated: new Date(cached.timestamp).toLocaleTimeString() + ' (Offline backup)',
            fromCache: true,
          };
        }
      }
    } catch {
      // fallback failed
    }
    throw new Error('Unable to fetch news from providers at this moment. Please check your internet connection or try again later.');
  }

  // Sort by publishedAt descending
  combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Save to cache
  try {
    const payload: CachedNews = {
      timestamp: Date.now(),
      articles: combined,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // LocalStorage quota error ignored
  }

  return {
    articles: combined,
    lastUpdated: new Date().toLocaleTimeString(),
    fromCache: false,
  };
}

async function fetchDevToArticles(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('https://dev.to/api/articles?per_page=20', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any): NewsArticle => {
      const tags = Array.isArray(item.tag_list) ? item.tag_list.map((t: string) => t.toLowerCase()) : [];
      let category: NewsArticle['category'] = 'general';
      if (tags.some((t: string) => t.includes('ai') || t.includes('machinelearning') || t.includes('gpt'))) {
        category = 'ai';
      } else if (tags.some((t: string) => t.includes('career') || t.includes('interview') || t.includes('jobs'))) {
        category = 'career';
      } else {
        category = 'tech';
      }

      return {
        id: `devto-${item.id}`,
        title: item.title,
        source: 'Dev.to',
        url: item.url,
        publishedAt: item.published_at || new Date().toISOString(),
        category,
        summary: item.description,
        author: item.user?.name || 'Dev.to Contributor',
        score: item.positive_reactions_count,
      };
    });
  } catch {
    return [];
  }
}

async function fetchHackerNewsArticles(): Promise<NewsArticle[]> {
  try {
    // Official Hacker News Firebase top stories
    const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!topRes.ok) return [];
    const ids: number[] = await topRes.json();
    if (!Array.isArray(ids)) return [];

    // Fetch details for top 15 items
    const top15 = ids.slice(0, 15);
    const itemPromises = top15.map(async (id) => {
      try {
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!itemRes.ok) return null;
        return await itemRes.json();
      } catch {
        return null;
      }
    });

    const items = await Promise.all(itemPromises);
    const valid = items.filter((it) => it && it.title && it.url);

    return valid.map((item: any): NewsArticle => {
      const titleLower = (item.title || '').toLowerCase();
      let category: NewsArticle['category'] = 'tech';
      if (titleLower.includes('ai') || titleLower.includes('llm') || titleLower.includes('gpt') || titleLower.includes('model')) {
        category = 'ai';
      } else if (titleLower.includes('hiring') || titleLower.includes('career') || titleLower.includes('job') || titleLower.includes('interview')) {
        category = 'career';
      }

      return {
        id: `hn-${item.id}`,
        title: item.title,
        source: 'Hacker News',
        url: item.url,
        publishedAt: item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString(),
        category,
        summary: `Discussion: ${item.descendants || 0} comments · ${item.score || 0} points`,
        author: item.by || 'HN User',
        score: item.score,
      };
    });
  } catch {
    return [];
  }
}
