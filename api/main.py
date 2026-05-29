"""
api/main.py — FastAPI backend for DebateFlow
Run with: uvicorn api.main:app --reload --port 8000
"""
import asyncio
import json
import uuid
import sys
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

# Make sure the project root is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from transcript_logger import TranscriptLogger
from workflow.debate_workflow import DebateWorkflow

app = FastAPI(title="DebateFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

transcript_logger = TranscriptLogger()


# ── Request/Response models ───────────────────────────────────────────────────

class StartDebateRequest(BaseModel):
    topic: str


class DebateSummary(BaseModel):
    debate_id: str
    topic: str
    winner: Optional[str]
    disqualified: Optional[str]
    total_rounds: int
    total_messages: int
    started_at: str


# ── Helper ────────────────────────────────────────────────────────────────────

def parse_winner_from_message(content: str) -> str:
    if "WINNER: PRO" in content:
        return "pro"
    elif "WINNER: CON" in content:
        return "con"
    elif "DISQUALIFIED: PRO" in content:
        return "con"
    elif "DISQUALIFIED: CON" in content:
        return "pro"
    return "draw"


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "DebateFlow API is running.",
        "routes": ["/health", "/debate/start", "/debates", "/debate/{debate_id}/transcript"]
    }


@app.get("/favicon.ico")
async def favicon():
    return Response(status_code=204)


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/debate/start")
async def start_debate(body: StartDebateRequest):
    """
    Kicks off a debate and streams each turn as a Server-Sent Event (SSE).
    The frontend listens with EventSource or fetch + ReadableStream.

    Each SSE event has the shape:
      data: {"type": "turn"|"done"|"error", ...}
    """
    debate_id = str(uuid.uuid4())
    topic = body.topic.strip()

    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")

    async def event_stream():
        try:
            # Announce debate started
            yield f"data: {json.dumps({'type': 'started', 'debate_id': debate_id, 'topic': topic})}\n\n"

            workflow = DebateWorkflow(transcript_logger=transcript_logger)

            # DebateWorkflow.run() returns the final state dict.
            # We wrap it so the frontend gets incremental updates via the
            # transcript_logger callback mechanism.
            # If your workflow supports async iteration, swap this out.
            result = await workflow.run(debate_id, topic=topic)

            messages = result.get("messages", [])
            round_summaries = result.get("round_summaries", [])

            # Stream each message as a turn event
            for msg in messages:
                event = {
                    "type": "turn",
                    "debate_id": debate_id,
                    "speaker": msg.get("speaker"),
                    "stage": msg.get("stage"),
                    "content": msg.get("content"),
                    "validated": msg.get("validated", False),
                    "round_number": msg.get("round_number", 1),
                    "timestamp": msg.get("timestamp", datetime.now(timezone.utc).isoformat()),
                }
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0)  # Yield control so FastAPI can flush

            # Determine winner
            final_msg_content = messages[-1]["content"] if messages else ""
            winner = parse_winner_from_message(final_msg_content)
            disqualified = result.get("disqualified")

            # Export CSV
            transcript_logger.export_csv(debate_id)

            # Done event
            yield f"data: {json.dumps({'type': 'done', 'debate_id': debate_id, 'winner': winner, 'disqualified': disqualified, 'total_rounds': result.get('round_number', 1), 'total_messages': len(messages)})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        },
    )


@app.get("/debate/{debate_id}/transcript")
async def get_transcript(debate_id: str):
    """Returns the full transcript for a debate as a list of messages."""
    import sqlite3
    conn = sqlite3.connect(transcript_logger.db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM debates WHERE debate_id = ? ORDER BY round, timestamp",
        (debate_id,)
    ).fetchall()
    conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="Debate not found.")

    messages = [dict(row) for row in rows]
    return {
        "debate_id": debate_id,
        "topic": messages[0]["topic"] if messages else "",
        "messages": messages,
        "total": len(messages),
    }


@app.get("/debates")
async def list_debates():
    """Returns a summary list of all past debates."""
    import sqlite3
    conn = sqlite3.connect(transcript_logger.db_path)
    conn.row_factory = sqlite3.Row

    # One row per debate — pick the last message for winner info
    rows = conn.execute("""
        SELECT
            debate_id,
            topic,
            MIN(timestamp) as started_at,
            COUNT(*) as total_messages,
            MAX(round) as total_rounds,
            MAX(CASE WHEN speaker = 'judge' THEN argument ELSE '' END) as verdict
        FROM debates
        GROUP BY debate_id
        ORDER BY started_at DESC
    """).fetchall()
    conn.close()

    debates = []
    for row in rows:
        d = dict(row)
        verdict = d.pop("verdict", "")
        d["winner"] = parse_winner_from_message(verdict) if verdict else None
        d["disqualified"] = None
        if "DISQUALIFIED: PRO" in verdict:
            d["disqualified"] = "pro"
        elif "DISQUALIFIED: CON" in verdict:
            d["disqualified"] = "con"
        debates.append(d)

    return {"debates": debates, "total": len(debates)}


@app.get("/debate/{debate_id}/export")
async def export_csv(debate_id: str):
    """Triggers a CSV export and returns the file path."""
    import sqlite3
    conn = sqlite3.connect(transcript_logger.db_path)
    exists = conn.execute(
        "SELECT 1 FROM debates WHERE debate_id = ? LIMIT 1", (debate_id,)
    ).fetchone()
    conn.close()

    if not exists:
        raise HTTPException(status_code=404, detail="Debate not found.")

    transcript_logger.export_csv(debate_id)
    return {"status": "exported", "path": f"transcripts/{debate_id}.csv"}
