# Life OS — Jarvis News Intelligence Backend

A lightweight, zero-cost Python FastAPI + SQLite news intelligence engine built for single-user personal command centers.
Fetches real-time news from **Chennai**, **Tamil Nadu**, **India**, and **Global** sources using verified RSS and optional external APIs.

---

## Features
- **100% Free Core Engine:** 17 verified RSS feeds from The Hindu, NDTV, Times of India, Indian Express, Hindustan Times, BBC, Al Jazeera, NYT, DW, France 24, Dinamalar, and Google News.
- **Hyperlocal & Regional:** Dedicated feeds for Chennai (English & Tamil) and Tamil Nadu state.
- **Automatic Deduplication:** Cleans tracking parameters (`utm_*`, `fbclid`, etc.) and detects near-duplicate headlines across outlets using normalized title similarity.
- **15-Minute Scheduler:** Background loop runs every 15 minutes without overloading publisher servers.
- **Live 24/7 TV Streams:** Official lazy-loaded YouTube live streams for NDTV, WION, Al Jazeera, Sky News, DW, and France 24.
- **Jarvis Daily AI Briefing:** 5-bullet executive overview + 2-line story briefs powered by Claude AI (cached for 30 minutes in SQLite to preserve credits).
- **Graceful Fallbacks:** If API keys are omitted or the backend is offline, the React frontend seamlessly falls back to cached news and open developer feeds without crashing.

---

## Quick Start (Windows PowerShell)

Open PowerShell in `c:\lets do it\news-backend`:

```powershell
# 1. Navigate to the backend directory
cd "c:\lets do it\news-backend"

# 2. Create the Python virtual environment
python -m venv venv

# 3. Activate the virtual environment
.\venv\Scripts\Activate.ps1

# 4. Install backend dependencies
pip install -r requirements.txt

# 5. Set up your environment variables
Copy-Item .env.example .env

# 6. Run the integration test suite (verifies all feeds and database)
python test_backend.py

# 7. Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The backend API will be live at:
`http://127.0.0.1:8000`
- API Documentation / Swagger: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`
- Live news endpoint: `http://127.0.0.1:8000/news`
- Source health telemetry: `http://127.0.0.1:8000/sources/health`
- AI Daily Briefing: `http://127.0.0.1:8000/briefing`

---

## Starting the Frontend (Life OS)

In a second PowerShell terminal in `c:\lets do it`:

```powershell
cd "c:\lets do it"
npm run dev
```

Navigate to `http://localhost:5173` and click the **News** tab on the sidebar. The UI will automatically connect to `http://127.0.0.1:8000`, show the live telemetry badge, and display your Chennai, Tamil Nadu, India, and Global intelligence stream.

---

## Optional Environment Keys (`.env`)

Edit `news-backend/.env` if you wish to enable additional features:
```ini
# Optional: The Guardian Open Platform (500 free calls/day)
GUARDIAN_KEY=your_key_here

# Optional: Currents API (250 free calls/day)
CURRENTS_KEY=your_key_here

# Optional: NewsData.io (200 free credits/day)
NEWSDATA_KEY=your_key_here

# Optional: Claude AI for Jarvis 5-bullet Daily Briefing
ANTHROPIC_KEY=your_anthropic_key_here
CLAUDE_MODEL=claude-3-haiku-20240307
```
*(If any key is left blank, that source is skipped automatically without errors).*
