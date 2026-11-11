"""
Verified news source feeds and external API registry.
All URLs have been verified with live HTTP test requests.
"""

from typing import List, Dict, Any

RSS_SOURCES: List[Dict[str, Any]] = [
    # ── LOCAL (CHENNAI) ────────────────────────────────────────────────────────
    {
        "name": "The Hindu (Chennai)",
        "url": "https://www.thehindu.com/news/cities/chennai/feeder/default.rss",
        "category": "Local",
        "default_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80", # Chennai Central / Marina
    },
    {
        "name": "Google News (Chennai)",
        "url": "https://news.google.com/rss/search?q=Chennai&hl=en-IN&gl=IN&ceid=IN:en",
        "category": "Local",
        "default_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80",
    },
    {
        "name": "Google News (Chennai Tamil)",
        "url": "https://news.google.com/rss/search?q=%E0%AE%9A%E0%AF%86%E0%AE%A9%E0%AF%8D%E0%AE%A9%E0%AF%88&hl=ta&gl=IN&ceid=IN:ta",
        "category": "Local",
        "default_image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80",
    },

    # ── REGIONAL (TAMIL NADU) ─────────────────────────────────────────────────
    {
        "name": "The Hindu (Tamil Nadu)",
        "url": "https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss",
        "category": "Regional",
        "default_image": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&auto=format&fit=crop&q=80", # Tamil Nadu Temple / Landscape
    },
    {
        "name": "Google News (Tamil Nadu)",
        "url": "https://news.google.com/rss/search?q=Tamil+Nadu&hl=en-IN&gl=IN&ceid=IN:en",
        "category": "Regional",
        "default_image": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&auto=format&fit=crop&q=80",
    },
    {
        "name": "Dinamalar (Tamil)",
        "url": "https://news.google.com/rss/search?q=site:dinamalar.com&hl=ta&gl=IN&ceid=IN:ta",
        "category": "Regional",
        "default_image": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&auto=format&fit=crop&q=80",
    },

    # ── NATIONAL (INDIA) ──────────────────────────────────────────────────────
    {
        "name": "The Hindu (National)",
        "url": "https://www.thehindu.com/news/national/feeder/default.rss",
        "category": "National",
        "default_image": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&auto=format&fit=crop&q=80", # India Gate
    },
    {
        "name": "NDTV",
        "url": "https://feeds.feedburner.com/ndtvnews-top-stories",
        "category": "National",
        "default_image": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80",
    },
    {
        "name": "Times of India",
        "url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "category": "National",
        "default_image": "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop&q=80",
    },
    {
        "name": "Indian Express",
        "url": "https://indianexpress.com/section/india/feed/",
        "category": "National",
        "default_image": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80",
    },
    {
        "name": "Hindustan Times",
        "url": "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
        "category": "National",
        "default_image": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80",
    },
    {
        "name": "Google News (India)",
        "url": "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",
        "category": "National",
        "default_image": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&auto=format&fit=crop&q=80",
    },

    # ── GLOBAL & WORLD ────────────────────────────────────────────────────────
    {
        "name": "BBC News",
        "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "category": "World",
        "default_image": "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=80",
    },
    {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "category": "World",
        "default_image": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80",
    },
    {
        "name": "New York Times",
        "url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
        "category": "World",
        "default_image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    },
    {
        "name": "DW News",
        "url": "https://rss.dw.com/rdf/rss-en-all",
        "category": "World",
        "default_image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    },
    {
        "name": "France 24",
        "url": "https://www.france24.com/en/rss",
        "category": "World",
        "default_image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80",
    },
]

CATEGORY_IMAGE_FALLBACKS = {
    "Local": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80",
    "Regional": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&auto=format&fit=crop&q=80",
    "National": "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&auto=format&fit=crop&q=80",
    "World": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    "Technology": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    "Business": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80",
    "Politics": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80",
    "Sports": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
    "Breaking": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80",
}

