import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the current directory or news-backend directory
backend_dir = Path(__file__).resolve().parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

# API Keys (all optional with graceful fallbacks)
GUARDIAN_KEY = os.getenv("GUARDIAN_KEY", "").strip()
CURRENTS_KEY = os.getenv("CURRENTS_KEY", "").strip()
NEWSDATA_KEY = os.getenv("NEWSDATA_KEY", "").strip()
ANTHROPIC_KEY = os.getenv("ANTHROPIC_KEY", "").strip()

# AI Model Configuration
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307").strip()

# Server & Security
PORT = int(os.getenv("PORT", "8000"))
raw_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
FRONTEND_ORIGINS = [o.strip() for o in raw_origins.split(",") if o.strip()]

# Database path
DB_PATH = str(backend_dir / "news.db")

# Scheduler frequency (15 minutes strictly per requirement)
FETCH_INTERVAL_MINUTES = 15

# Global HTTP Request Settings
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 LifeOS-Jarvis/1.0"
REQUEST_TIMEOUT = 14.0

