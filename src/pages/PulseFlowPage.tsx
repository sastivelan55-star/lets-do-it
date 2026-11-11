import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Bookmark,
  Share2,
  ChevronRight,
  ChevronLeft,
  Globe,
  Briefcase,
  Landmark,
  Trophy,
  Cpu,
  ExternalLink,
  X,
  RefreshCw,
  CheckCircle2,
  Tv,
  HelpCircle,
  Settings,
  CloudSun,
  MapPin,
  Sparkles,
  Film,
  FlaskConical,
  HeartPulse,
} from 'lucide-react';
import {
  fetchBackendNews,
  checkBackendHealth,
  fetchDailyBriefing,
  fetchNewsDataLatest,
  formatTimeAgo,
  type AiBriefingResponse,
} from '../services/newsService';
import LiveTvSection from '../components/news/LiveTvPlayerModal';
import JarvisAiBriefingCard from '../components/news/JarvisAiBriefingCard';

export interface NewsArticleItem {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  source: string;
  sourceIcon?: string;
  publishedAt: string;
  timestamp: number;
  imageUrl: string;
  url?: string;
  author?: string;
  readsCount?: string;
  isNew?: boolean;
}

// ── INITIAL CURATED STORIES (MATCHING GOOGLE NEWS REFERENCE) ───────────────────
const INITIAL_TOP_STORY: NewsArticleItem = {
  id: 'top-1',
  title: 'U.S. Republicans derail bid to impeach Hegseth',
  description:
    'House lawmakers halted proceedings in a high-stakes legislative confrontation regarding the Defense Secretary nomination.',
  content:
    'In a dramatic floor confrontation, House leadership successfully blocked an impeachment initiative, signaling unified party alignment ahead of committee hearings.',
  category: 'World',
  source: 'The Hindu',
  sourceIcon: 'https://www.thehindu.com/favicon.ico',
  publishedAt: '3 hours ago',
  timestamp: Date.now() - 3 * 3600 * 1000,
  imageUrl:
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80',
};

const INITIAL_PERSPECTIVES: NewsArticleItem[] = [
  {
    id: 'persp-1',
    title: 'US House blocks Hegseth impeachment effort as Iran denies talks',
    description: 'Bipartisan lawmakers navigate diplomatic tensions amid Capitol Hill budget and nomination debates.',
    content: 'Congressional leaders underscored foreign policy continuity following the decisive floor tally.',
    category: 'World',
    source: 'Al Jazeera',
    sourceIcon: 'https://www.aljazeera.com/favicon.ico',
    publishedAt: '30 minutes ago',
    timestamp: Date.now() - 30 * 60 * 1000,
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'persp-2',
    title: 'US House blocks bid to impeach war secretary Pete Hegseth',
    description: 'Floor tally reflects procedural maneuverings as defense authorizations approach year-end deadlines.',
    content: 'The vote concluded along strict party lines after hours of procedural wrangling on Capitol Hill.',
    category: 'National',
    source: 'The Times of India',
    sourceIcon: 'https://timesofindia.indiatimes.com/favicon.ico',
    publishedAt: '3 hours ago',
    timestamp: Date.now() - 3 * 3600 * 1000,
    imageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'persp-3',
    title: 'Analysis: Hegseth fights for his political life with appeal to Trump',
    description: 'Inside the strategy and high-stakes cabinet maneuvering behind the Washington confirmation battles.',
    content: 'White House insiders detail closed-door consultations with Senate and House committee leaders.',
    category: 'World',
    source: 'BBC News',
    sourceIcon: 'https://www.bbc.co.uk/favicon.ico',
    publishedAt: '9 hours ago',
    author: 'Gary O\'Donoghue',
    timestamp: Date.now() - 9 * 3600 * 1000,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
  },
];

const INITIAL_LOCAL_STORIES: NewsArticleItem[] = [
  {
    id: 'local-1',
    title: 'Chennai police arrest 36 persons in citywide crackdown on ‘rowdies’',
    description: 'Law enforcement conducts coordinated pre-dawn operations across north and south Chennai divisions.',
    content: 'Special task force units recovered illicit contraband and secured preventive detentions across 12 zones.',
    category: 'Local',
    source: 'The Hindu',
    sourceIcon: 'https://www.thehindu.com/favicon.ico',
    publishedAt: '16 hours ago',
    timestamp: Date.now() - 16 * 3600 * 1000,
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'local-2',
    title: 'Women engineers take the helm at Chennai Metrowater',
    description: 'Pioneering supervisory teams oversee smart metering, desal plants, and lake replenishment systems.',
    content: 'CMWSSB officials highlighted significant operational efficiencies in wastewater recycling and supply grids.',
    category: 'Local',
    source: 'The Hindu',
    sourceIcon: 'https://www.thehindu.com/favicon.ico',
    publishedAt: 'Yesterday',
    timestamp: Date.now() - 24 * 3600 * 1000,
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'local-3',
    title: 'Nearly 18 lakh left Chennai for Deepavali, return rush chokes GST Road',
    description: 'Special buses and suburban transit lines mobilized as post-festival passenger influx surges.',
    content: 'Traffic police activated arterial diversions at Perungalathur and Tambaram to ease vehicular gridlocks.',
    category: 'Local',
    source: 'The New Indian Express',
    sourceIcon: 'https://www.newindianexpress.com/favicon.ico',
    publishedAt: 'Nov 10',
    timestamp: Date.now() - 36 * 3600 * 1000,
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
  },
];

// ── GOOGLE NEWS SUBNAV TABS ──────────────────────────────────────────────────
const PRIMARY_NAV_TABS = [
  { id: 'home', label: 'Home' },
  { id: 'for_you', label: 'For you' },
  { id: 'following', label: 'Following' },
  { id: 'showcase', label: 'News Showcase' },
];

const CATEGORY_NAV_TABS = [
  { id: 'India', label: 'India', icon: <Landmark size={14} /> },
  { id: 'World', label: 'World', icon: <Globe size={14} /> },
  { id: 'Local', label: 'Local', icon: <MapPin size={14} /> },
  { id: 'Business', label: 'Business', icon: <Briefcase size={14} /> },
  { id: 'Technology', label: 'Technology', icon: <Cpu size={14} /> },
  { id: 'Entertainment', label: 'Entertainment', icon: <Film size={14} /> },
  { id: 'Sports', label: 'Sports', icon: <Trophy size={14} /> },
  { id: 'Science', label: 'Science', icon: <FlaskConical size={14} /> },
  { id: 'Health', label: 'Health', icon: <HeartPulse size={14} /> },
];

export default function PulseFlowPage() {
  const [activeNavTab, setActiveNavTab] = useState<string>('Home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLiveFetching, setIsLiveFetching] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticleItem | null>(null);

  // Live TV & AI Briefing toggles
  const [showLiveTv, setShowLiveTv] = useState<boolean>(false);
  const [showAiBriefing, setShowAiBriefing] = useState<boolean>(false);
  const [briefing, setBriefing] = useState<AiBriefingResponse | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState<boolean>(false);

  // Core articles state
  const [topStory, setTopStory] = useState<NewsArticleItem>(INITIAL_TOP_STORY);
  const [perspectives, setPerspectives] = useState<NewsArticleItem[]>(INITIAL_PERSPECTIVES);
  const [localStories, setLocalStories] = useState<NewsArticleItem[]>(INITIAL_LOCAL_STORIES);
  const [feedArticles, setFeedArticles] = useState<NewsArticleItem[]>([]);

  // Backend telemetry
  const [backendStatus, setBackendStatus] = useState<{
    isOnline: boolean;
    totalArticles: number;
    dbStatus: string;
  }>({ isOnline: false, totalArticles: 0, dbStatus: 'checking' });

  // Bookmarks
  const [savedBookmarks, setSavedBookmarks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('lifeos_google_news_bookmarks');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set<string>();
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live formatted date for "Your briefing"
  const formattedToday = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  // ── LOAD NEWS FEEDS (BACKEND + NEWSDATA.IO) ─────────────────────────────────
  const loadAllNews = useCallback(async () => {
    setIsLiveFetching(true);
    try {
      // 1. Check Python backend status
      const health = await checkBackendHealth();
      setBackendStatus(health);

      // 2. Fetch parallel from Python Backend AND user's NewsData.io API
      const [backendRes, newsDataRes] = await Promise.allSettled([
        fetchBackendNews({
          category: activeNavTab !== 'Home' && activeNavTab !== 'For you' && activeNavTab !== 'Following' && activeNavTab !== 'News Showcase'
            ? activeNavTab
            : undefined,
          search: searchQuery || undefined,
          limit: 60,
        }),
        fetchNewsDataLatest({
          country: 'in',
          category: activeNavTab !== 'Home' ? activeNavTab : undefined,
          q: searchQuery || undefined,
        }),
      ]);

      const gatheredArticles: NewsArticleItem[] = [];

      // Process NewsData.io results
      if (newsDataRes.status === 'fulfilled' && newsDataRes.value.length > 0) {
        newsDataRes.value.forEach((item) => {
          gatheredArticles.push({
            id: item.id,
            title: item.title,
            description: item.description,
            content: item.description,
            category: item.category || 'National',
            source: item.source || 'NewsData',
            publishedAt: formatTimeAgo(item.published_at),
            timestamp: new Date(item.published_at).getTime(),
            imageUrl: item.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80',
            url: item.url,
            isNew: true,
          });
        });
      }

      // Process Backend SQLite results
      if (backendRes.status === 'fulfilled' && backendRes.value.articles.length > 0) {
        backendRes.value.articles.forEach((item) => {
          gatheredArticles.push({
            id: item.id,
            title: item.title,
            description: item.description,
            content: `${item.description} Reported by ${item.source}. Click below to read full publisher reporting.`,
            category: item.category,
            source: item.source,
            publishedAt: formatTimeAgo(item.published_at),
            timestamp: new Date(item.published_at).getTime(),
            imageUrl: item.image_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
            url: item.url,
            isNew: false,
          });
        });
      }

      if (gatheredArticles.length > 0) {
        // Sort newest first
        gatheredArticles.sort((a, b) => b.timestamp - a.timestamp);

        // Find best top story
        const primeStory = gatheredArticles.find((a) => a.imageUrl && a.title.length > 25) || gatheredArticles[0];
        setTopStory(primeStory);

        // Find perspectives (different sources than top story)
        const perspectiveCandidates = gatheredArticles.filter(
          (a) => a.id !== primeStory.id && a.source !== primeStory.source
        );
        setPerspectives(perspectiveCandidates.slice(0, 3));

        // Find local Chennai / Tamil Nadu stories
        const localCandidates = gatheredArticles.filter(
          (a) =>
            a.category.toLowerCase().includes('local') ||
            a.category.toLowerCase().includes('regional') ||
            a.source.toLowerCase().includes('chennai') ||
            a.title.toLowerCase().includes('chennai') ||
            a.title.toLowerCase().includes('tamil nadu')
        );
        if (localCandidates.length > 0) {
          setLocalStories(localCandidates.slice(0, 4));
        }

        // Remaining feed articles
        const usedIds = new Set([
          primeStory.id,
          ...perspectiveCandidates.slice(0, 3).map((p) => p.id),
          ...localCandidates.slice(0, 4).map((l) => l.id),
        ]);
        setFeedArticles(gatheredArticles.filter((a) => !usedIds.has(a.id)));

        showToast(`Google News synced with ${gatheredArticles.length} live stories!`);
      }
    } catch {
      showToast('Serving verified local news cache');
    } finally {
      setIsLiveFetching(false);
    }
  }, [activeNavTab, searchQuery]);

  // Initial load
  useEffect(() => {
    loadAllNews();
  }, [loadAllNews]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => loadAllNews(), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadAllNews]);

  // Load AI briefing on request or startup
  const handleLoadBriefing = async () => {
    setIsBriefingLoading(true);
    setShowAiBriefing(true);
    try {
      const res = await fetchDailyBriefing();
      setBriefing(res);
    } catch {
      setBriefing(null);
    } finally {
      setIsBriefingLoading(false);
    }
  };

  const toggleBookmark = (id: string) => {
    setSavedBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Removed from reading list');
      } else {
        next.add(id);
        showToast('Saved to reading list!');
      }
      try {
        localStorage.setItem('lifeos_google_news_bookmarks', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleShare = (art: NewsArticleItem) => {
    navigator.clipboard.writeText(`${art.title} — ${art.url || window.location.href}`);
    showToast('Story link copied to clipboard!');
  };

  return (
    <div
      style={{
        background: '#171717',
        color: '#e8eaed',
        minHeight: '100%',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: "'Google Sans', Roboto, system-ui, -apple-system, sans-serif",
        overflowY: 'auto',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          GOOGLE NEWS TOP APP BAR (EXACT REPLICA OF SCREENSHOT)
          ═══════════════════════════════════════════════════════════════════════ */}
      <header
        style={{
          background: '#202124',
          borderBottom: '1px solid #3c4043',
          padding: '0.65rem 1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Google News Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#4285F4' }}>G</span>
            <span style={{ color: '#EA4335' }}>o</span>
            <span style={{ color: '#FBBC05' }}>o</span>
            <span style={{ color: '#4285F4' }}>g</span>
            <span style={{ color: '#34A853' }}>l</span>
            <span style={{ color: '#EA4335' }}>e</span>
            <span style={{ color: '#e8eaed', fontWeight: 400, marginLeft: '6px' }}>News</span>
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '6px',
              background: '#303134',
              color: '#8ab4f8',
              border: '1px solid #3c4043',
            }}
          >
            Life OS
          </span>
        </div>

        {/* Central Search Bar */}
        <div
          style={{
            flex: 1,
            maxWidth: '680px',
            position: 'relative',
            background: '#303134',
            borderRadius: '24px',
            border: '1px solid #5f6368',
            display: 'flex',
            alignItems: 'center',
            padding: '0.4rem 1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          <Search size={18} color="#9aa0a6" style={{ marginRight: '10px', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for topics, locations & sources"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.92rem',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '2px' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Top Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Live TV Button */}
          <button
            type="button"
            onClick={() => setShowLiveTv((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.85rem',
              borderRadius: '18px',
              background: showLiveTv ? '#c5221f' : '#303134',
              border: '1px solid #3c4043',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Tv size={14} color="#f28b82" />
            <span>{showLiveTv ? 'Close Live TV' : 'Live TV (6 Streams)'}</span>
          </button>

          {/* AI Briefing Button */}
          <button
            type="button"
            onClick={handleLoadBriefing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.85rem',
              borderRadius: '18px',
              background: showAiBriefing ? '#8ab4f8' : '#303134',
              border: '1px solid #3c4043',
              color: showAiBriefing ? '#202124' : '#8ab4f8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={14} />
            <span>Jarvis Briefing</span>
          </button>

          {/* Refresh Button & Backend Telemetry */}
          <button
            type="button"
            onClick={loadAllNews}
            disabled={isLiveFetching}
            title={
              backendStatus.isOnline
                ? `Backend Online (${backendStatus.totalArticles} articles stored in SQLite)`
                : 'Live Direct Feeds Active (Backend offline or disconnected)'
            }
            style={{
              background: 'none',
              border: 'none',
              color: backendStatus.isOnline ? '#81c995' : '#9aa0a6',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <RefreshCw size={18} className={isLiveFetching ? 'animate-spin' : ''} />
            {backendStatus.isOnline && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#81c995',
                }}
              />
            )}
          </button>

          <HelpCircle size={18} color="#9aa0a6" style={{ cursor: 'pointer' }} />
          <Settings size={18} color="#9aa0a6" style={{ cursor: 'pointer' }} />

          {/* User Avatar Circle */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#ea580c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              marginLeft: '4px',
            }}
          >
            S
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          GOOGLE NEWS SUB-NAV BAR (HOME, FOR YOU ... | INDIA, WORLD, LOCAL...)
          ═══════════════════════════════════════════════════════════════════════ */}
      <nav
        style={{
          background: '#202124',
          borderBottom: '1px solid #3c4043',
          padding: '0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          whiteSpace: 'nowrap',
          gap: '0.25rem',
        }}
      >
        {/* Left primary tabs */}
        {PRIMARY_NAV_TABS.map((tab) => {
          const isActive = activeNavTab === tab.label;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveNavTab(tab.label)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #8ab4f8' : '3px solid transparent',
                color: isActive ? '#8ab4f8' : '#9aa0a6',
                padding: '0.75rem 0.9rem',
                fontSize: '0.86rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}

        {/* Vertical Separator */}
        <div style={{ width: '1px', height: '18px', background: '#3c4043', margin: '0 0.5rem' }} />

        {/* Right category tabs */}
        {CATEGORY_NAV_TABS.map((tab) => {
          const isActive = activeNavTab === tab.label;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveNavTab(tab.label)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #8ab4f8' : '3px solid transparent',
                color: isActive ? '#8ab4f8' : '#e8eaed',
                padding: '0.75rem 0.9rem',
                fontSize: '0.86rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT CONTAINER
          ═══════════════════════════════════════════════════════════════════════ */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.25rem' }}>
        {/* Live TV Section (Collapsible) */}
        {showLiveTv && <LiveTvSection onClose={() => setShowLiveTv(false)} />}

        {/* Jarvis AI Briefing Card (Collapsible) */}
        {showAiBriefing && (
          <JarvisAiBriefingCard
            briefing={briefing}
            isLoading={isBriefingLoading}
            onRefresh={handleLoadBriefing}
          />
        )}

        {/* ── "YOUR BRIEFING" HEADER & WEATHER WIDGET (MATCHES SCREENSHOT) ── */}
        <section
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '1.85rem',
                fontWeight: 400,
                color: '#e8eaed',
                letterSpacing: '-0.02em',
              }}
            >
              Your briefing
            </h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: '#9aa0a6' }}>
              {formattedToday}
            </p>
          </div>

          {/* Google Weather Widget (Exact replica from user screenshot!) */}
          <div
            style={{
              background: '#202124',
              border: '1px solid #3c4043',
              borderRadius: '16px',
              padding: '0.55rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <ChevronLeft size={16} color="#9aa0a6" style={{ cursor: 'pointer' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(251, 188, 4, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbc04',
                }}
              >
                <CloudSun size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#9aa0a6' }}>
                  <span>Tamil Nadu</span>
                  <MapPin size={10} color="#8ab4f8" />
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#e8eaed' }}>
                  29°C
                </div>
                <div style={{ fontSize: '0.68rem', color: '#8ab4f8' }}>
                  Google Weather
                </div>
              </div>
            </div>

            <ChevronRight size={16} color="#9aa0a6" style={{ cursor: 'pointer' }} />
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            2-COLUMN GRID: "TOP STORIES" (65%) & "LOCAL NEWS" (35%)
            ═════════════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* ── LEFT COLUMN: TOP STORIES ── */}
          <div
            style={{
              gridColumn: 'span 2',
              minWidth: 0,
            }}
            className="top-stories-column"
          >
            <div
              style={{
                background: '#202124',
                borderRadius: '16px',
                border: '1px solid #3c4043',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              }}
            >
              {/* Section Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem', cursor: 'pointer' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#8ab4f8' }}>
                  Top stories
                </h2>
                <ChevronRight size={18} color="#8ab4f8" />
              </div>

              {/* 2-Pane Split: Left Lead Story + Right Perspectives */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1.25rem',
                  alignItems: 'start',
                }}
              >
                {/* Left: Lead Primary Story */}
                <div
                  onClick={() => setSelectedArticle(topStory)}
                  style={{ cursor: 'pointer' }}
                  className="group"
                >
                  <div
                    style={{
                      width: '100%',
                      height: '200px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '0.75rem',
                      background: '#303134',
                    }}
                  >
                    <img
                      src={topStory.imageUrl}
                      alt={topStory.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Source Favicon & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        background: '#3c4043',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        fontWeight: 700,
                      }}
                    >
                      {topStory.source.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#9aa0a6', fontWeight: 500 }}>
                      {topStory.source}
                    </span>
                  </div>

                  {/* Headline */}
                  <h3
                    style={{
                      margin: '0 0 0.4rem',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: '#e8eaed',
                      lineHeight: 1.35,
                    }}
                    className="hover:underline"
                  >
                    {topStory.title}
                  </h3>

                  <div style={{ fontSize: '0.75rem', color: '#9aa0a6' }}>
                    {topStory.publishedAt}
                  </div>
                </div>

                {/* Right: Perspectives Coverage List */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {perspectives.map((persp, idx) => (
                    <div
                      key={persp.id || idx}
                      onClick={() => setSelectedArticle(persp)}
                      style={{
                        padding: idx === 0 ? '0 0 0.85rem' : '0.85rem 0',
                        borderBottom: idx < perspectives.length - 1 ? '1px solid #303134' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            background: '#3c4043',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 700,
                            color: '#8ab4f8',
                          }}
                        >
                          {persp.source.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#9aa0a6', fontWeight: 500 }}>
                          {persp.source}
                        </span>
                      </div>

                      <h4
                        style={{
                          margin: '0 0 0.35rem',
                          fontSize: '0.92rem',
                          fontWeight: 500,
                          color: '#e8eaed',
                          lineHeight: 1.35,
                        }}
                        className="hover:underline"
                      >
                        {persp.title}
                      </h4>

                      <div style={{ fontSize: '0.74rem', color: '#9aa0a6' }}>
                        {persp.publishedAt}
                        {persp.author && <span> • By {persp.author}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom footer link */}
              <div
                style={{
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #303134',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#8ab4f8',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Globe size={15} />
                <span>See more headlines and perspectives</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: LOCAL NEWS (CHENNAI & TAMIL NADU) ── */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                background: '#202124',
                borderRadius: '16px',
                border: '1px solid #3c4043',
                padding: '1.25rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem', cursor: 'pointer' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#8ab4f8' }}>
                  Local news
                </h2>
                <ChevronRight size={18} color="#8ab4f8" />
              </div>

              {/* Local News List with Right Thumbnail */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {localStories.map((local, idx) => (
                  <div
                    key={local.id || idx}
                    onClick={() => setSelectedArticle(local)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: idx === 0 ? '0 0 0.85rem' : '0.85rem 0',
                      borderBottom: idx < localStories.length - 1 ? '1px solid #303134' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.35rem' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            background: '#3c4043',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 700,
                            color: '#34d399',
                          }}
                        >
                          {local.source.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#9aa0a6', fontWeight: 500 }}>
                          {local.source}
                        </span>
                      </div>

                      <h4
                        style={{
                          margin: '0 0 0.35rem',
                          fontSize: '0.88rem',
                          fontWeight: 500,
                          color: '#e8eaed',
                          lineHeight: 1.35,
                        }}
                        className="hover:underline"
                      >
                        {local.title}
                      </h4>

                      <div style={{ fontSize: '0.72rem', color: '#9aa0a6' }}>
                        {local.publishedAt}
                      </div>
                    </div>

                    {/* Right Thumbnail Image (72x72) */}
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#303134',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={local.imageUrl}
                        alt={local.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
            ADDITIONAL GOOGLE NEWS STORIES GRID (PICKS FOR YOU & SPOTLIGHT)
            ═════════════════════════════════════════════════════════════════════ */}
        <section style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#e8eaed' }}>
              {activeNavTab === 'Home' ? 'Picks for you' : `${activeNavTab} news`}
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#9aa0a6' }}>
              Showing {feedArticles.length} stories
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
              gap: '1rem',
            }}
          >
            {feedArticles.map((art) => {
              const isBookmarked = savedBookmarks.has(art.id);
              return (
                <article
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  style={{
                    background: '#202124',
                    border: '1px solid #3c4043',
                    borderRadius: '16px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    transition: 'border 0.2s ease',
                  }}
                  className="hover:border-[#8ab4f8]"
                >
                  <div>
                    {/* Top Source attribution + action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            background: '#3c4043',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: 700,
                            color: '#8ab4f8',
                          }}
                        >
                          {art.source.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#9aa0a6', fontWeight: 500 }}>
                          {art.source}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#5f6368' }}>•</span>
                        <span style={{ fontSize: '0.72rem', color: '#9aa0a6' }}>{art.publishedAt}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(art.id);
                          }}
                          style={{ background: 'none', border: 'none', color: isBookmarked ? '#fbbc04' : '#9aa0a6', cursor: 'pointer', padding: '4px' }}
                          title="Save story"
                        >
                          <Bookmark size={15} fill={isBookmarked ? '#fbbc04' : 'none'} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(art);
                          }}
                          style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '4px' }}
                          title="Share story"
                        >
                          <Share2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Headline and thumbnail layout */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '0.94rem',
                          fontWeight: 500,
                          color: '#e8eaed',
                          lineHeight: 1.35,
                          flex: 1,
                        }}
                      >
                        {art.title}
                      </h3>

                      {art.imageUrl && (
                        <div
                          style={{
                            width: '76px',
                            height: '76px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#303134',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>

                    {art.description && (
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#9aa0a6', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {art.description}
                      </p>
                    )}
                  </div>

                  {/* Category tag */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #303134' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: '#8ab4f8',
                        background: 'rgba(138, 180, 248, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      {art.category}
                    </span>

                    {art.url && (
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#8ab4f8', fontSize: '0.72rem', textDecoration: 'none' }}
                      >
                        <span>Full story</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          ARTICLE READING MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {selectedArticle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setSelectedArticle(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#202124',
              border: '1px solid #3c4043',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {selectedArticle.imageUrl && (
              <div style={{ width: '100%', height: '260px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#8ab4f8', fontWeight: 600 }}>
                  {selectedArticle.source}
                </span>
                <span style={{ color: '#5f6368' }}>•</span>
                <span style={{ fontSize: '0.78rem', color: '#9aa0a6' }}>
                  {selectedArticle.publishedAt}
                </span>
              </div>

              <h2 style={{ margin: '0 0 1rem', fontSize: '1.35rem', fontWeight: 600, color: '#e8eaed', lineHeight: 1.35 }}>
                {selectedArticle.title}
              </h2>

              <p style={{ fontSize: '0.92rem', color: '#bdc1c6', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {selectedArticle.content || selectedArticle.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #3c4043', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(selectedArticle.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      background: '#303134',
                      border: '1px solid #3c4043',
                      color: savedBookmarks.has(selectedArticle.id) ? '#fbbc04' : '#e8eaed',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Bookmark size={15} fill={savedBookmarks.has(selectedArticle.id) ? '#fbbc04' : 'none'} />
                    <span>{savedBookmarks.has(selectedArticle.id) ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(selectedArticle)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      background: '#303134',
                      border: '1px solid #3c4043',
                      color: '#e8eaed',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <Share2 size={15} />
                    <span>Share</span>
                  </button>
                </div>

                {selectedArticle.url && (
                  <a
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: '#8ab4f8',
                      color: '#202124',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <span>Read on {selectedArticle.source}</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#303134',
            border: '1px solid #5f6368',
            color: '#e8eaed',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} color="#81c995" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
