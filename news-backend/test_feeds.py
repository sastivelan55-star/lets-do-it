"""
Test all candidate RSS feeds using real HTTP requests with realistic User-Agent.
Reports HTTP status, feedparser entries count, and error reasons.
"""

import httpx
import feedparser
import sys
import json

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 LifeOS/1.0",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}

CANDIDATES = [
    {"name": "The Hindu (Chennai)", "url": "https://www.thehindu.com/news/cities/chennai/feeder/default.rss", "category": "Local"},
    {"name": "The Hindu (Tamil Nadu)", "url": "https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss", "category": "Regional"},
    {"name": "The Hindu (National)", "url": "https://www.thehindu.com/news/national/feeder/default.rss", "category": "National"},
    {"name": "NDTV (Top Stories)", "url": "https://feeds.feedburner.com/ndtvnews-top-stories", "category": "National"},
    {"name": "Times of India (Top Stories)", "url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", "category": "National"},
    {"name": "Indian Express (India)", "url": "https://indianexpress.com/section/india/feed/", "category": "National"},
    {"name": "Hindustan Times (Top Stories)", "url": "https://www.hindustantimes.com/feeds/rss/httopstories/rssfeed.xml", "category": "National"},
    {"name": "BBC News (World)", "url": "https://feeds.bbci.co.uk/news/world/rss.xml", "category": "World"},
    {"name": "Al Jazeera (World)", "url": "https://www.aljazeera.com/xml/rss/all.xml", "category": "World"},
    {"name": "NYT (World)", "url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "category": "World"},
    {"name": "DW News (World)", "url": "https://rss.dw.com/rdf/rss-en-all", "category": "World"},
    {"name": "France 24 (World)", "url": "https://www.france24.com/en/rss", "category": "World"},
    {"name": "Dinamalar (Tamil Nadu)", "url": "https://rss.dinamalar.com/?cat=tamilnadu", "category": "Regional"},
    {"name": "Google News (Chennai Local)", "url": "https://news.google.com/rss/search?q=Chennai&hl=en-IN&gl=IN&ceid=IN:en", "category": "Local"},
    {"name": "Google News (Tamil Nadu Regional)", "url": "https://news.google.com/rss/search?q=Tamil+Nadu&hl=en-IN&gl=IN&ceid=IN:en", "category": "Regional"},
    {"name": "Google News (India National)", "url": "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en", "category": "National"},
    {"name": "Google News (Chennai Tamil)", "url": "https://news.google.com/rss/search?q=%E0%AE%9A%E0%AF%86%E0%AE%A9%E0%AF%8D%E0%AE%A9%E0%AF%88&hl=ta&gl=IN&ceid=IN:ta", "category": "Local"},
]

def test_feed(client, item):
    name = item["name"]
    url = item["url"]
    try:
        response = client.get(url, timeout=12.0, follow_redirects=True)
        status_code = response.status_code
        if status_code != 200:
            return {"name": name, "url": url, "status": "FAIL", "http_code": status_code, "entries": 0, "reason": f"HTTP {status_code}"}
        
        parsed = feedparser.parse(response.content)
        entries_count = len(parsed.entries)
        
        if entries_count == 0:
            return {"name": name, "url": url, "status": "FAIL", "http_code": status_code, "entries": 0, "reason": "XML returned 0 entries / bozo bit set: " + str(parsed.get('bozo', ''))}
            
        sample_title = parsed.entries[0].get("title", "")[:60]
        return {"name": name, "url": url, "status": "OK", "http_code": status_code, "entries": entries_count, "sample": sample_title}
    except Exception as e:
        return {"name": name, "url": url, "status": "FAIL", "http_code": None, "entries": 0, "reason": str(e)}

def main():
    print("Testing candidate RSS feeds with real HTTP requests...")
    results = []
    with httpx.Client(headers=HEADERS, verify=True) as client:
        for item in CANDIDATES:
            res = test_feed(client, item)
            results.append(res)
            status_symbol = "✓" if res["status"] == "OK" else "✗"
            if res["status"] == "OK":
                print(f" {status_symbol} {res['name']}: {res['entries']} entries (Sample: '{res['sample']}')")
            else:
                print(f" {status_symbol} {res['name']}: FAILED ({res['reason']})")
                
    with open("feed_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("\nResults saved to feed_test_results.json")

if __name__ == "__main__":
    main()

