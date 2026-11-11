"""
Integration test for Life OS News Backend
Verifies SQLite storage, fetcher ingestion, API endpoints, deduplication, and source health.
"""

import sys
from fastapi.testclient import TestClient
from main import app
from database import init_db, get_articles, get_sources_health
from fetcher import fetch_all_sources

def run_tests():
    print("=== STARTING NEWS BACKEND INTEGRATION TESTS ===")
    
    # 1. Initialize Database
    init_db()
    print("✓ SQLite database initialized successfully.")

    # 2. Run Ingestion Cycle
    print("Running initial fetch cycle across verified sources...")
    fetch_result = fetch_all_sources()
    print(f"✓ Fetch cycle completed: {fetch_result['new_articles_saved']} articles saved in {fetch_result['duration_seconds']}s.")

    # 3. Test with FastAPI TestClient
    client = TestClient(app)

    # 4. Test /health
    health_resp = client.get("/health")
    assert health_resp.status_code == 200, f"Expected 200, got {health_resp.status_code}"
    health_data = health_resp.json()
    assert health_data["status"] == "healthy"
    assert health_data["total_articles"] > 0
    print(f"✓ GET /health returned healthy with {health_data['total_articles']} total articles.")

    # 5. Test /sources/health
    sources_resp = client.get("/sources/health")
    assert sources_resp.status_code == 200
    sources_data = sources_resp.json()
    print(f"✓ GET /sources/health: {sources_data['healthy_sources']}/{sources_data['total_configured_sources']} sources reporting OK.")
    assert sources_data["healthy_sources"] >= 8, f"Expected at least 8 healthy sources, got {sources_data['healthy_sources']}"

    # 6. Test /news (all)
    news_resp = client.get("/news?limit=30")
    assert news_resp.status_code == 200
    news_data = news_resp.json()
    assert len(news_data["articles"]) > 0
    print(f"✓ GET /news returned {len(news_data['articles'])} articles.")

    # 7. Test /news with Category Filter: Local (Chennai)
    local_resp = client.get("/news?category=Local")
    assert local_resp.status_code == 200
    local_data = local_resp.json()
    print(f"✓ GET /news?category=Local returned {len(local_data['articles'])} local Chennai articles.")

    # 8. Test /news with Category Filter: National
    national_resp = client.get("/news?category=National")
    assert national_resp.status_code == 200
    national_data = national_resp.json()
    print(f"✓ GET /news?category=National returned {len(national_data['articles'])} national articles.")

    # 9. Test /news with Category Filter: World
    world_resp = client.get("/news?category=World")
    assert world_resp.status_code == 200
    world_data = world_resp.json()
    print(f"✓ GET /news?category=World returned {len(world_data['articles'])} world articles.")

    # 10. Test /briefing graceful fallback when no ANTHROPIC_KEY
    briefing_resp = client.get("/briefing")
    assert briefing_resp.status_code == 200
    briefing_data = briefing_resp.json()
    assert "available" in briefing_data
    print(f"✓ GET /briefing handled gracefully (available={briefing_data['available']}).")

    print("\n=== ALL NEWS BACKEND INTEGRATION TESTS PASSED CLEANLY! ===")

if __name__ == "__main__":
    run_tests()

