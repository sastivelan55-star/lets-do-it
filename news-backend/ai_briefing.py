import json
import httpx
from datetime import datetime, timezone
from typing import Dict, Any

from config import ANTHROPIC_KEY, CLAUDE_MODEL, USER_AGENT
from database import get_articles, get_cached_briefing, save_briefing

async def generate_daily_briefing() -> Dict[str, Any]:
    # 1. Check if Anthropic API key is provided
    if not ANTHROPIC_KEY:
        return {
            "available": False,
            "message": "AI Briefing is not enabled. Set ANTHROPIC_KEY in news-backend/.env to activate Jarvis AI news summaries.",
        }

    # 2. Check 30-minute SQLite cache
    cached = get_cached_briefing(max_age_minutes=30)
    if cached:
        return cached

    # 3. Pull top 20 recent articles from SQLite
    top_articles = get_articles(limit=20)
    if not top_articles:
        return {
            "available": False,
            "message": "Not enough articles ingested yet to generate a briefing. Please wait for the initial fetch cycle to finish.",
        }

    # Format stories for Claude prompt
    stories_context = "\n".join([
        f"- [{a['category']}] ({a['source']}) {a['title']}: {a['description'][:200]}"
        for a in top_articles
    ])

    prompt = f"""You are Jarvis, a personal AI intelligence analyst.
Analyze the following 20 recent news headlines from local (Chennai/Tamil Nadu), national (India), and global sources:

{stories_context}

Return a STRICT JSON object with this exact schema (no markdown formatting, no code fences):
{{
  "title": "Jarvis Executive Daily Intelligence Briefing",
  "bullet_points": [
    "1st major takeaway in one concise, impactful sentence.",
    "2nd major takeaway in one concise, impactful sentence.",
    "3rd major takeaway in one concise, impactful sentence.",
    "4th major takeaway in one concise, impactful sentence.",
    "5th major takeaway in one concise, impactful sentence."
  ],
  "top_story_summaries": [
    {{
      "title": "Title of top story 1",
      "summary": "Exactly 2 lines explaining what happened and why it matters."
    }},
    {{
      "title": "Title of top story 2",
      "summary": "Exactly 2 lines explaining what happened and why it matters."
    }},
    {{
      "title": "Title of top story 3",
      "summary": "Exactly 2 lines explaining what happened and why it matters."
    }}
  ]
}}
"""

    headers = {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "user-agent": USER_AGENT,
    }

    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": 1024,
        "temperature": 0.3,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers)

            if resp.status_code != 200:
                return {
                    "available": False,
                    "error": f"Anthropic API returned HTTP {resp.status_code}: {resp.text[:200]}",
                }

            result_data = resp.json()
            content_blocks = result_data.get("content", [])
            if not content_blocks:
                return {"available": False, "error": "No response text received from Claude."}

            text_response = content_blocks[0].get("text", "").strip()
            # Clean possible markdown code fences if model enclosed it
            if text_response.startswith("```"):
                text_response = text_response.strip("`")
                if text_response.startswith("json"):
                    text_response = text_response[4:].strip()

            parsed_briefing = json.loads(text_response)
            parsed_briefing["available"] = True
            parsed_briefing["cached"] = False
            parsed_briefing["model"] = CLAUDE_MODEL
            parsed_briefing["generated_at"] = datetime.now(timezone.utc).isoformat()

            # Save to 30-minute cache
            save_briefing(parsed_briefing)
            return parsed_briefing

    except Exception as e:
        return {
            "available": False,
            "error": f"Failed to generate AI briefing: {str(e)}",
        }

