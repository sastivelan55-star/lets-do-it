import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import PORT, FRONTEND_ORIGINS
from database import init_db, get_articles, get_sources_health, get_connection
from scheduler import start_scheduler, stop_scheduler
from fetcher import fetch_all_sources
from ai_briefing import generate_daily_briefing

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite schema and start 15-minute background scheduler
    print("[Life OS News Backend] Initializing SQLite database...")
    init_db()
    print(f"[Life OS News Backend] Starting 15-minute background fetch scheduler...")
    start_scheduler()
    yield
    # Shutdown
    print("[Life OS News Backend] Stopping background scheduler...")
    stop_scheduler()

app = FastAPI(
    title="Life OS — Jarvis News Intelligence API",
    description="High-performance, zero-cost personal news backend aggregating Chennai, India, and Global intelligence.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration restricted to frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
def get_health():
    """System health check & database statistics."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS total FROM articles")
        count = cursor.fetchone()["total"]
        conn.close()
        db_status = "connected"
    except Exception as e:
        count = 0
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "service": "Life OS Jarvis News Engine",
        "database": db_status,
        "total_articles": count,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/sources/health")
def get_sources_status():
    """Returns the last fetch health and article yield for every active news source."""
    health_records = get_sources_health()
    total_sources = len(health_records)
    healthy_sources = sum(1 for r in health_records if r["last_status"] == "OK")

    return {
        "total_configured_sources": total_sources,
        "healthy_sources": healthy_sources,
        "sources": health_records,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@app.get("/news")
def get_news_feed(
    category: Optional[str] = Query(None, description="Category filter (Local, Regional, National, World, etc.)"),
    source: Optional[str] = Query(None, description="Source filter (e.g., 'The Hindu (Chennai)', 'NDTV')"),
    search: Optional[str] = Query(None, description="Keyword search in title, description, or source"),
    limit: int = Query(50, ge=1, le=200, description="Max number of articles to return"),
):
    """Returns news articles sorted by real publication time descending."""
    articles = get_articles(category=category, source=source, search=search, limit=limit)
    return {
        "count": len(articles),
        "filter": {
            "category": category or "All",
            "source": source or "All",
            "search": search or None,
        },
        "articles": articles,
    }

@app.get("/briefing")
async def get_briefing():
    """Generates or retrieves the 30-minute cached Jarvis executive briefing."""
    return await generate_daily_briefing()

@app.post("/fetch-now")
async def trigger_fetch():
    """Allows manual on-demand refresh of news sources."""
    result = await asyncio.to_thread(fetch_all_sources)
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=PORT, reload=False)

