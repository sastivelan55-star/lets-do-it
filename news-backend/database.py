import sqlite3
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from config import DB_PATH

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Articles table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL,
        category TEXT NOT NULL,
        published_at TEXT NOT NULL,
        fetched_at TEXT NOT NULL,
        image_url TEXT
    )
    """)

    # Indexes for fast querying & sorting
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source)")

    # 2. Source health telemetry table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS source_health (
        source_name TEXT PRIMARY KEY,
        source_type TEXT NOT NULL,
        last_status TEXT NOT NULL,
        last_fetch_time TEXT NOT NULL,
        articles_fetched INTEGER NOT NULL DEFAULT 0,
        error_message TEXT
    )
    """)

    # 3. AI Briefing Cache table (cached for 30 minutes)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS briefing_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        content_json TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

def save_article(article: Dict[str, Any]) -> bool:
    """Inserts or updates an article. Returns True if inserted as new."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO articles (id, title, description, url, source, category, published_at, fetched_at, image_url)
        VALUES (:id, :title, :description, :url, :source, :category, :published_at, :fetched_at, :image_url)
        ON CONFLICT(url) DO UPDATE SET
            title=excluded.title,
            description=excluded.description,
            published_at=excluded.published_at,
            image_url=COALESCE(excluded.image_url, articles.image_url)
        """, article)
        inserted = cursor.rowcount > 0
        conn.commit()
        return inserted
    except Exception as e:
        print(f"Database save error for {article.get('url')}: {e}")
        return False
    finally:
        conn.close()

def get_articles(
    category: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM articles WHERE 1=1"
    params: List[Any] = []

    if category and category.lower() not in ("all", "all news"):
        # Support case-insensitive partial match for category
        query += " AND LOWER(category) = LOWER(?)"
        params.append(category)

    if source and source.lower() not in ("all", "all channels"):
        query += " AND LOWER(source) = LOWER(?)"
        params.append(source)

    if search:
        search_term = f"%{search.strip().lower()}%"
        query += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(source) LIKE ?)"
        params.extend([search_term, search_term, search_term])

    # Sort strictly by real published_at descending
    query += " ORDER BY published_at DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def get_all_article_titles(limit: int = 150) -> List[str]:
    """Used by deduplication to prevent near-duplicate stories."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT title FROM articles ORDER BY published_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [row["title"] for row in rows]

def update_source_health(source_name: str, source_type: str, status: str, count: int, error: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO source_health (source_name, source_type, last_status, last_fetch_time, articles_fetched, error_message)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_name) DO UPDATE SET
        last_status=excluded.last_status,
        last_fetch_time=excluded.last_fetch_time,
        articles_fetched=excluded.articles_fetched,
        error_message=excluded.error_message
    """, (source_name, source_type, status, now_iso, count, error))
    conn.commit()
    conn.close()

def get_sources_health() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM source_health ORDER BY source_name ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_cached_briefing(max_age_minutes: int = 30) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT created_at, content_json FROM briefing_cache ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    try:
        created_time = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        age_minutes = (now - created_time).total_seconds() / 60.0
        if age_minutes < max_age_minutes:
            data = json.loads(row["content_json"])
            data["cached"] = True
            data["cache_age_minutes"] = round(age_minutes, 1)
            data["created_at"] = row["created_at"]
            return data
    except Exception as e:
        print(f"Error parsing briefing cache: {e}")

    return None

def save_briefing(data: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("INSERT INTO briefing_cache (created_at, content_json) VALUES (?, ?)", (now_iso, json.dumps(data)))
    conn.commit()
    conn.close()

