import re
import html
import hashlib
import time
from datetime import datetime, timezone
import httpx
import feedparser
from typing import Dict, Any, List

from config import (
    USER_AGENT, REQUEST_TIMEOUT,
    GUARDIAN_KEY, CURRENTS_KEY, NEWSDATA_KEY
)
from sources import RSS_SOURCES, CATEGORY_IMAGE_FALLBACKS
from deduplication import clean_canonical_url, is_duplicate_title
from database import save_article, update_source_health, get_all_article_titles

def strip_html_tags(raw_html: str, max_chars: int = 300) -> str:
    """Removes HTML markup, decodes HTML entities, and trims to max_chars cleanly."""
    if not raw_html:
        return ""
    # Strip scripts/styles
    cleaned = re.sub(r"<(script|style).*?>.*?</\1>", "", raw_html, flags=re.DOTALL | re.IGNORECASE)
    # Strip HTML tags
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    # Unescape HTML entities (&amp;, &#39;, etc.)
    cleaned = html.unescape(cleaned)
    # Normalize whitespaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) > max_chars:
        # Cut at word boundary
        trimmed = cleaned[:max_chars].rsplit(" ", 1)[0]
        return trimmed + "..."
    return cleaned

def parse_iso_date(entry: Any) -> str:
    """Normalizes feed date entry into an ISO 8601 UTC string."""
    now_utc = datetime.now(timezone.utc)
    
    # 1. Check feedparser's published_parsed tuple
    parsed_time = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed_time:
        try:
            dt = datetime(*parsed_time[:6], tzinfo=timezone.utc)
            return dt.isoformat()
        except Exception:
            pass

    # 2. Check raw string fields
    raw_date = entry.get("published") or entry.get("updated") or entry.get("pubDate")
    if raw_date and isinstance(raw_date, str):
        try:
            # Common formats
            from email.utils import parsedate_to_datetime
            dt = parsedate_to_datetime(raw_date)
            return dt.astimezone(timezone.utc).isoformat()
        except Exception:
            try:
                dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                return dt.astimezone(timezone.utc).isoformat()
            except Exception:
                pass

    return now_utc.isoformat()

def extract_image_url(entry: Any, default_image: str) -> str:
    """Extracts high-resolution thumbnail from RSS entry if available."""
    # Check media_content
    media_content = entry.get("media_content", [])
    if isinstance(media_content, list) and len(media_content) > 0:
        url = media_content[0].get("url")
        if url and (url.startswith("http://") or url.startswith("https://")):
            return url

    # Check media_thumbnail
    media_thumbnail = entry.get("media_thumbnail", [])
    if isinstance(media_thumbnail, list) and len(media_thumbnail) > 0:
        url = media_thumbnail[0].get("url")
        if url and (url.startswith("http://") or url.startswith("https://")):
            return url

    # Check enclosures
    enclosures = entry.get("enclosures", [])
    if isinstance(enclosures, list) and len(enclosures) > 0:
        url = enclosures[0].get("href") or enclosures[0].get("url")
        if url and any(ext in url.lower() for ext in (".jpg", ".jpeg", ".png", ".webp")):
            return url

    # Check embedded <img> in summary or description
    desc = entry.get("summary", "") or entry.get("description", "")
    img_match = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', desc, re.IGNORECASE)
    if img_match:
        return img_match.group(1)

    return default_image

def fetch_rss_feed(source: Dict[str, Any], client: httpx.Client, existing_titles: List[str]) -> int:
    name = source["name"]
    url = source["url"]
    category = source["category"]
    default_img = source.get("default_image", CATEGORY_IMAGE_FALLBACKS.get(category, ""))

    try:
        response = client.get(url, timeout=REQUEST_TIMEOUT, follow_redirects=True)
        if response.status_code != 200:
            update_source_health(name, "rss", "FAIL", 0, f"HTTP {response.status_code}")
            print(f"[FAIL] {name}: HTTP {response.status_code}")
            return 0

        parsed = feedparser.parse(response.content)
        entries = parsed.entries
        saved_count = 0

        for entry in entries[:30]: # Up to 30 freshest entries per source
            raw_title = entry.get("title", "").strip()
            raw_url = entry.get("link", "").strip()
            if not raw_title or not raw_url:
                continue

            canonical_url = clean_canonical_url(raw_url)
            if not canonical_url:
                continue

            # Title similarity check
            if is_duplicate_title(raw_title, existing_titles):
                continue

            raw_desc = entry.get("summary", "") or entry.get("description", "")
            description = strip_html_tags(raw_desc, max_chars=300)
            if not description:
                description = raw_title

            published_at = parse_iso_date(entry)
            image_url = extract_image_url(entry, default_img)
            article_id = hashlib.md5(f"{canonical_url}-{raw_title}".encode("utf-8")).hexdigest()

            article_record = {
                "id": article_id,
                "title": raw_title,
                "description": description,
                "url": canonical_url,
                "source": name,
                "category": category,
                "published_at": published_at,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "image_url": image_url,
            }

            if save_article(article_record):
                saved_count += 1
                existing_titles.append(raw_title)

        update_source_health(name, "rss", "OK", saved_count, None)
        print(f"[OK]   {name}: {saved_count} new/updated articles saved (from {len(entries)} entries)")
        return saved_count

    except Exception as e:
        err_msg = str(e)
        update_source_health(name, "rss", "FAIL", 0, err_msg)
        print(f"[FAIL] {name}: {err_msg}")
        return 0

# ── OPTIONAL EXTRA APIS (GUARDED BY API KEYS) ─────────────────────────────────

def fetch_guardian_api(client: httpx.Client, existing_titles: List[str]) -> int:
    if not GUARDIAN_KEY:
        return 0
    name = "The Guardian (API)"
    try:
        url = "https://content.guardianapis.com/search"
        params = {
            "api-key": GUARDIAN_KEY,
            "page-size": 20,
            "show-fields": "headline,trailText,thumbnail",
            "order-by": "newest",
        }
        resp = client.get(url, params=params, timeout=REQUEST_TIMEOUT)
        if resp.status_code != 200:
            update_source_health(name, "api", "FAIL", 0, f"HTTP {resp.status_code}")
            return 0

        data = resp.json().get("response", {})
        results = data.get("results", [])
        saved = 0

        for r in results:
            title = r.get("webTitle", "").strip()
            web_url = clean_canonical_url(r.get("webUrl", "").strip())
            fields = r.get("fields", {})
            desc = strip_html_tags(fields.get("trailText", title), 300)
            img = fields.get("thumbnail") or CATEGORY_IMAGE_FALLBACKS["World"]
            pub_date = r.get("webPublicationDate", datetime.now(timezone.utc).isoformat())

            if is_duplicate_title(title, existing_titles):
                continue

            art_id = hashlib.md5(f"{web_url}-{title}".encode("utf-8")).hexdigest()
            record = {
                "id": art_id,
                "title": title,
                "description": desc,
                "url": web_url,
                "source": "The Guardian",
                "category": "World",
                "published_at": pub_date,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "image_url": img,
            }
            if save_article(record):
                saved += 1
                existing_titles.append(title)

        update_source_health(name, "api", "OK", saved, None)
        print(f"[OK]   {name}: {saved} articles saved")
        return saved
    except Exception as e:
        update_source_health(name, "api", "FAIL", 0, str(e))
        return 0

def fetch_currents_api(client: httpx.Client, existing_titles: List[str]) -> int:
    if not CURRENTS_KEY:
        return 0
    name = "Currents (API)"
    try:
        url = "https://api.currentsapi.services/v1/latest-news"
        params = {"apiKey": CURRENTS_KEY, "language": "en"}
        resp = client.get(url, params=params, timeout=REQUEST_TIMEOUT)
        if resp.status_code != 200:
            update_source_health(name, "api", "FAIL", 0, f"HTTP {resp.status_code}")
            return 0

        news = resp.json().get("news", [])
        saved = 0
        for item in news[:20]:
            title = item.get("title", "").strip()
            web_url = clean_canonical_url(item.get("url", "").strip())
            desc = strip_html_tags(item.get("description", title), 300)
            img = item.get("image") or CATEGORY_IMAGE_FALLBACKS["World"]
            pub_date = item.get("published", datetime.now(timezone.utc).isoformat())

            if is_duplicate_title(title, existing_titles):
                continue

            art_id = hashlib.md5(f"{web_url}-{title}".encode("utf-8")).hexdigest()
            record = {
                "id": art_id,
                "title": title,
                "description": desc,
                "url": web_url,
                "source": item.get("author") or "Currents News",
                "category": "World",
                "published_at": pub_date,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "image_url": img,
            }
            if save_article(record):
                saved += 1
                existing_titles.append(title)

        update_source_health(name, "api", "OK", saved, None)
        print(f"[OK]   {name}: {saved} articles saved")
        return saved
    except Exception as e:
        update_source_health(name, "api", "FAIL", 0, str(e))
        return 0

def fetch_newsdata_api(client: httpx.Client, existing_titles: List[str]) -> int:
    if not NEWSDATA_KEY:
        return 0
    name = "NewsData.io (API)"
    try:
        url = "https://newsdata.io/api/1/news"
        params = {"apikey": NEWSDATA_KEY, "country": "in", "language": "en,ta"}
        resp = client.get(url, params=params, timeout=REQUEST_TIMEOUT)
        if resp.status_code != 200:
            update_source_health(name, "api", "FAIL", 0, f"HTTP {resp.status_code}")
            return 0

        results = resp.json().get("results", [])
        saved = 0
        for item in results[:20]:
            title = item.get("title", "").strip()
            web_url = clean_canonical_url(item.get("link", "").strip())
            desc = strip_html_tags(item.get("description", title), 300)
            img = item.get("image_url") or CATEGORY_IMAGE_FALLBACKS["National"]
            pub_date = item.get("pubDate", datetime.now(timezone.utc).isoformat())

            if is_duplicate_title(title, existing_titles):
                continue

            art_id = hashlib.md5(f"{web_url}-{title}".encode("utf-8")).hexdigest()
            record = {
                "id": art_id,
                "title": title,
                "description": desc,
                "url": web_url,
                "source": item.get("source_id") or "NewsData",
                "category": "National",
                "published_at": pub_date,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "image_url": img,
            }
            if save_article(record):
                saved += 1
                existing_titles.append(title)

        update_source_health(name, "api", "OK", saved, None)
        print(f"[OK]   {name}: {saved} articles saved")
        return saved
    except Exception as e:
        update_source_health(name, "api", "FAIL", 0, str(e))
        return 0

def fetch_all_sources() -> Dict[str, Any]:
    """Runs a complete fetch cycle across all core RSS and extra API sources."""
    start_time = time.time()
    existing_titles = get_all_article_titles(limit=250)
    total_saved = 0

    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting scheduled news ingestion cycle...")

    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/rss+xml, application/xml, text/xml, application/json, */*",
    }

    with httpx.Client(headers=headers, verify=True) as client:
        # 1. Fetch core RSS feeds
        for source in RSS_SOURCES:
            total_saved += fetch_rss_feed(source, client, existing_titles)

        # 2. Fetch extra APIs (if configured)
        if GUARDIAN_KEY:
            total_saved += fetch_guardian_api(client, existing_titles)
        if CURRENTS_KEY:
            total_saved += fetch_currents_api(client, existing_titles)
        if NEWSDATA_KEY:
            total_saved += fetch_newsdata_api(client, existing_titles)

    elapsed = round(time.time() - start_time, 2)
    print(f"Ingestion cycle completed in {elapsed}s. Total new/updated articles saved: {total_saved}\n")

    return {
        "status": "success",
        "new_articles_saved": total_saved,
        "duration_seconds": elapsed,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

