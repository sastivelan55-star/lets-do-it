import asyncio
from config import FETCH_INTERVAL_MINUTES
from fetcher import fetch_all_sources

_scheduler_task = None

async def scheduler_loop():
    """Runs fetch_all_sources every 15 minutes (never more often)."""
    # Run immediate fetch on startup in a worker thread to keep event loop responsive
    print("Scheduler initiated: Running initial startup fetch...")
    await asyncio.to_thread(fetch_all_sources)

    interval_seconds = FETCH_INTERVAL_MINUTES * 60
    while True:
        try:
            print(f"Scheduler sleeping for {FETCH_INTERVAL_MINUTES} minutes until next fetch...")
            await asyncio.sleep(interval_seconds)
            print("Scheduler waking up for 15-minute fetch cycle...")
            await asyncio.to_thread(fetch_all_sources)
        except asyncio.CancelledError:
            print("Scheduler background task cancelled.")
            break
        except Exception as e:
            print(f"Error in scheduler loop: {e}")
            await asyncio.sleep(60) # Wait 1 minute on unexpected failure before trying next interval

def start_scheduler():
    global _scheduler_task
    if _scheduler_task is None:
        _scheduler_task = asyncio.create_task(scheduler_loop())

def stop_scheduler():
    global _scheduler_task
    if _scheduler_task is not None:
        _scheduler_task.cancel()
        _scheduler_task = None

