// Life OS Jarvis News Service
// Bridges React frontend with FastAPI backend (http://127.0.0.1:8000)
// With fallback to verified open channels (Dev.to & Hacker News) when backend is offline.

import type { NewsArticle } from '../types';

export const BACKEND_BASE_URL =
  import.meta.env.VITE_NEWS_API_URL || 'http://127.0.0.1:8000';

const CACHE_KEY = 'life_os_backend_news_cache_v2';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export interface BackendArticle {
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

export interface BackendNewsResponse {
  count: number;
  filter: {
    category: string;
    source: string;
    search: string | null;
  };
  articles: BackendArticle[];
  isOffline?: boolean;
}

export interface SourceHealthRecord {
  source_name: string;
  source_type: string;
  last_status: 'OK' | 'FAIL';
  last_fetch_time: string;
  articles_fetched: number;
  error_message: string | null;
}

export interface SourcesHealthResponse {
  total_configured_sources: number;
  healthy_sources: number;
  sources: SourceHealthRecord[];
  timestamp: string;
}

export interface AiBriefingResponse {
  available: boolean;
  message?: string;
  error?: string;
  title?: string;
  model?: string;
  bullet_points?: string[];
  top_story_summaries?: Array<{
    title: string;
    summary: string;
  }>;
  cached?: boolean;
  cache_age_minutes?: number;
  generated_at?: string;
}

// ── FORMAT TIME AGO UTILITY ──────────────────────────────────────────────────
export function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'Just now';
  try {
    const pubDate = new Date(isoString);
    if (isNaN(pubDate.getTime())) return 'Recently';
    const now = Date.now();
    const diffSec = Math.floor((now - pubDate.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return pubDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

// ── BACKEND NEWS API CALLS ───────────────────────────────────────────────────

export async function fetchBackendNews(params?: {
  category?: string;
  source?: string;
  search?: string;
  limit?: number;
}): Promise<BackendNewsResponse> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'All' && params.category !== 'All News') {
    query.set('category', params.category);
  }
  if (params?.source && params.source !== 'All' && params.source !== 'All Channels') {
    query.set('source', params.source);
  }
  if (params?.search && params.search.trim()) {
    query.set('search', params.search.trim());
  }
  query.set('limit', String(params?.limit || 60));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(`${BACKEND_BASE_URL}/news?${query.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data: BackendNewsResponse = await res.json();
      // Cache in localStorage for offline fallback
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            articles: data.articles,
          })
        );
      } catch {}
      return data;
    }
  } catch {
    // Network/backend offline
  }

  // Fallback to cached articles from previous backend fetch
  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      if (Array.isArray(cached.articles) && cached.articles.length > 0) {
        let filtered = cached.articles as BackendArticle[];
        if (params?.category && params.category !== 'All') {
          filtered = filtered.filter(
            (a) => a.category.toLowerCase() === params.category?.toLowerCase()
          );
        }
        if (params?.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(
            (a) =>
              a.title.toLowerCase().includes(s) ||
              a.description.toLowerCase().includes(s) ||
              a.source.toLowerCase().includes(s)
          );
        }
        return {
          count: filtered.length,
          filter: {
            category: params?.category || 'All',
            source: params?.source || 'All',
            search: params?.search || null,
          },
          articles: filtered,
          isOffline: true,
        };
      }
    }
  } catch {}

  return {
    count: 0,
    filter: { category: 'All', source: 'All', search: null },
    articles: [],
    isOffline: true,
  };
}

export async function checkBackendHealth(): Promise<{
  isOnline: boolean;
  totalArticles: number;
  dbStatus: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${BACKEND_BASE_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        isOnline: true,
        totalArticles: data.total_articles || 0,
        dbStatus: data.database || 'connected',
      };
    }
  } catch {}

  return {
    isOnline: false,
    totalArticles: 0,
    dbStatus: 'offline',
  };
}

export async function fetchSourcesHealth(): Promise<SourcesHealthResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${BACKEND_BASE_URL}/sources/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function fetchDailyBriefing(): Promise<AiBriefingResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for AI

    const res = await fetch(`${BACKEND_BASE_URL}/briefing`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return {
    available: false,
    message: 'Backend AI endpoint is currently unreachable.',
  };
}

export const NEWSDATA_API_KEY = 'pub_0dbe00b0c806495bb3f9ca2a235b487c';

export async function fetchNewsDataLatest(params?: {
  country?: string;
  category?: string;
  q?: string;
  language?: string;
}): Promise<BackendArticle[]> {
  try {
    const query = new URLSearchParams();
    query.set('apikey', NEWSDATA_API_KEY);
    query.set('country', params?.country || 'in');
    if (params?.language) query.set('language', params.language);
    if (params?.category && params.category !== 'All' && params.category !== 'All News') {
      const cat = params.category.toLowerCase();
      // map standard categories to NewsData values
      if (['business', 'technology', 'entertainment', 'sports', 'science', 'health', 'politics', 'world', 'top'].includes(cat)) {
        query.set('category', cat);
      }
    }
    if (params?.q) query.set('q', params.q);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://newsdata.io/api/1/latest?${query.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) {
        return data.results.map((r: any) => ({
          id: r.article_id || `nd-${Math.random()}`,
          title: r.title || 'Untitled',
          description: r.description || r.title || '',
          url: r.link || '',
          source: r.source_name || r.source_id || 'NewsData',
          category: Array.isArray(r.category) ? r.category[0] : (r.category || 'National'),
          published_at: r.pubDate || new Date().toISOString(),
          fetched_at: new Date().toISOString(),
          image_url: r.image_url || undefined,
        }));
      }
    }
  } catch (e) {
    console.warn('NewsData.io direct fetch notice:', e);
  }
  return [];
}

// ── COMPATIBILITY EXPORT: fetchNewsArticles ──────────────────────────────────
export async function fetchNewsArticles(
  forceRefresh = false
): Promise<{ articles: NewsArticle[]; lastUpdated: string; fromCache: boolean }> {
  const backendData = await fetchBackendNews({ limit: 40 });
  if (backendData.articles && backendData.articles.length > 0) {
    const mapped: NewsArticle[] = backendData.articles.map((a) => {
      let cat: NewsArticle['category'] = 'general';
      const cLower = a.category.toLowerCase();
      if (cLower.includes('tech')) cat = 'tech';
      else if (cLower.includes('business')) cat = 'career';

      return {
        id: a.id,
        title: a.title,
        source: a.source,
        url: a.url,
        publishedAt: a.published_at,
        category: cat,
        summary: a.description,
        author: a.source,
      };
    });

    return {
      articles: mapped,
      lastUpdated: new Date().toLocaleTimeString(),
      fromCache: Boolean(backendData.isOffline),
    };
  }

  // If backend is empty or offline, fallback to Dev.to + Hacker News
  return await fetchFallbackOpenChannels(forceRefresh);
}

async function fetchFallbackOpenChannels(
  forceRefresh: boolean
): Promise<{ articles: NewsArticle[]; lastUpdated: string; fromCache: boolean }> {
  const fallbackKey = 'life_os_fallback_open_channels';
  if (!forceRefresh) {
    try {
      const saved = localStorage.getItem(fallbackKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.articles?.length > 0) {
          return {
            articles: parsed.articles,
            lastUpdated: new Date(parsed.timestamp).toLocaleTimeString(),
            fromCache: true,
          };
        }
      }
    } catch {}
  }

  const [devToRes, hnRes] = await Promise.allSettled([
    fetchDevToArticles(),
    fetchHackerNewsArticles(),
  ]);

  const combined: NewsArticle[] = [];
  if (devToRes.status === 'fulfilled') combined.push(...devToRes.value);
  if (hnRes.status === 'fulfilled') combined.push(...hnRes.value);

  combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  try {
    localStorage.setItem(fallbackKey, JSON.stringify({ timestamp: Date.now(), articles: combined }));
  } catch {}

  return {
    articles: combined,
    lastUpdated: new Date().toLocaleTimeString(),
    fromCache: false,
  };
}

async function fetchDevToArticles(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('https://dev.to/api/articles?per_page=15', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any): NewsArticle => ({
      id: `devto-${item.id}`,
      title: item.title,
      source: 'Dev.to',
      url: item.url,
      publishedAt: item.published_at || new Date().toISOString(),
      category: 'tech',
      summary: item.description,
      author: item.user?.name || 'Dev.to Contributor',
      score: item.positive_reactions_count,
    }));
  } catch {
    return [];
  }
}

async function fetchHackerNewsArticles(): Promise<NewsArticle[]> {
  try {
    const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!topRes.ok) return [];
    const ids: number[] = await topRes.json();
    if (!Array.isArray(ids)) return [];

    const top10 = ids.slice(0, 10);
    const itemPromises = top10.map(async (id) => {
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

    return valid.map((item: any): NewsArticle => ({
      id: `hn-${item.id}`,
      title: item.title,
      source: 'Hacker News',
      url: item.url,
      publishedAt: item.time ? new Date(item.time * 1000).toISOString() : new Date().toISOString(),
      category: 'tech',
      summary: `Discussion: ${item.descendants || 0} comments · ${item.score || 0} points`,
      author: item.by || 'HN User',
      score: item.score,
    }));
  } catch {
    return [];
  }
}
