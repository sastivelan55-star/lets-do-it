import { useState, useEffect, useMemo } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Search, AlertCircle, Clock } from 'lucide-react';
import { fetchNewsArticles } from '../services/newsService';
import type { NewsArticle } from '../types';
import { formatSafeErrorMessage } from '../utils/errorUtils';

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadNews = async (force = false) => {
    if (force) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetchNewsArticles(force);
      setArticles(res.articles);
      setLastUpdated(res.lastUpdated);
    } catch (err: unknown) {
      setError(formatSafeErrorMessage(err, 'Could not load news feeds.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return articles.filter((art) => {
      const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
      const matchesQuery =
        !q ||
        art.title.toLowerCase().includes(q) ||
        (art.summary && art.summary.toLowerCase().includes(q)) ||
        art.source.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [articles, searchQuery, selectedCategory]);

  const CATEGORIES = [
    { id: 'all', label: 'All News' },
    { id: 'tech', label: '💻 Tech & Systems' },
    { id: 'ai', label: '🤖 AI & Models' },
    { id: 'career', label: '💼 Career & Hiring' },
    { id: 'general', label: '🌐 General Engineering' },
  ];

  return (
    <div className="page-container pb-safe">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            📰 <span className="gradient-text">Engineering & Industry News</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Curated daily developer feeds from official Hacker News & Dev.to APIs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> Refreshed: {lastUpdated}
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => loadNews(true)}
            disabled={isLoading || isRefreshing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : undefined} />
            {isRefreshing ? 'Refreshing…' : 'Refresh Feed'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '0.875rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              className="input"
              style={{ paddingLeft: '2.1rem', fontSize: '0.85rem' }}
              placeholder="Search news by headline, keywords, or source…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed List */}
      {isLoading ? (
        <div className="card" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
          <RefreshCw size={28} color="#818cf8" className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading industry news…</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <Newspaper size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>No articles found</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {searchQuery ? `No articles matching "${searchQuery}".` : 'No articles available in this category right now.'}
          </p>
          {searchQuery && (
            <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1rem' }}>
          {filteredArticles.map((art) => (
            <article
              key={art.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.1rem',
                borderTop: art.source === 'Hacker News' ? '3px solid #f97316' : '3px solid #818cf8',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
                  <span
                    className="badge"
                    style={{
                      background: art.source === 'Hacker News' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(129, 140, 248, 0.15)',
                      color: art.source === 'Hacker News' ? '#f97316' : '#818cf8',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    {art.source}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(art.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <h2 style={{ fontSize: '0.98rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                  >
                    {art.title}
                  </a>
                </h2>

                {art.summary && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {art.summary.length > 130 ? art.summary.slice(0, 130) + '…' : art.summary}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)',
                  marginTop: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  By {art.author || art.source}
                </span>

                <a
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', color: 'var(--accent)', padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Read Article <ExternalLink size={12} />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
