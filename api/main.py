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
        "http://127.0.0.1:3000",
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


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_winner_from_message(content: str) -> str:
    """
    Robustly parse winner/disqualification from freeform judge text.

    Looks for common patterns (case-insensitive):
      - explicit winner lines: "winner: pro", "winner - CON", "PRO wins"
      - disqualification lines: "disqualified: pro" (opponent wins)
      - draw/tie words

    Returns one of: "pro", "con", or "draw".
    """
    import re
    if not content:
        return "draw"
    s = content.lower()

    # Check explicit disqualification first (disqualified: PRO -> opponent wins)
    m = re.search(r"disqualif(?:ied)?[:\-\s]*\s*(pro|con)\b", s)
    if m:
        dis = m.group(1)
        return "con" if dis == "pro" else "pro"

    # Check explicit winner lines like "winner: pro" or "result: con"
    m = re.search(r"(?:winner|verdict|result)[:\-\s]*\s*(pro|con|draw|tie)\b", s)
    if m:
        val = m.group(1)
        if val in ("draw", "tie"):
            return "draw"
        return val

    # Common phrase patterns like "PRO wins", "CON wins"
    m = re.search(r"\b(pro|con)\b\s+win(?:s)?\b", s)
    if m:
        return m.group(1)

    # Fallback: look for uppercase tokens like "PRO" or "CON" near the end
    if " pro " in s or s.strip().endswith(" pro") or s.strip().startswith("pro "):
        return "pro"
    if " con " in s or s.strip().endswith(" con") or s.strip().startswith("con "):
        return "con"

    # If nothing matched, treat as draw
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
    Kicks off a debate and streams progress as Server-Sent Events (SSE).

    Event types:
      started  — debate kicked off, includes debate_id
      ping     — keepalive sent every 15s while debate runs (ignore on frontend)
      turn     — one agent message, streamed after debate completes
      done     — debate finished, includes winner/stats
      error    — something went wrong
    """
    debate_id = str(uuid.uuid4())
    # Validate incoming topic strictly to prevent empty debates
    if not body.topic or not body.topic.strip():
        raise HTTPException(status_code=400, detail="Topic required")
    topic = body.topic.strip()

    # Create a request-specific queue and logger to capture events in real time
    queue = asyncio.Queue()
    req_logger = TranscriptLogger(
        db_path=transcript_logger.db_path,
        csv_path=transcript_logger.csv_path,
        event_queue=queue
    )

    async def event_stream():
        # Keep a reference to the background task so we can cancel it on disconnect
        task = None
        try:
            # ── 1. Announce start ─────────────────────────────────────────
            yield f"data: {json.dumps({'type': 'started', 'debate_id': debate_id, 'topic': topic})}\n\n"

            workflow = DebateWorkflow(transcript_logger=req_logger)

            # ── 2. Run debate in background ──
            task = asyncio.create_task(workflow.run(debate_id, topic=topic))

            # Consume events from the queue in real time
            while not task.done() or not queue.empty():
                try:
                    # Retrieve the next event from the queue. Timeout every 15s to send keepalive
                    event_payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    
                    event_type = event_payload.get("event")
                    if event_type == "turn":
                        # Formulate the event exactly as the frontend expects
                        event = {
                            "type": "turn",
                            "debate_id": debate_id,
                            "speaker": event_payload.get("speaker"),
                            "stage": event_payload.get("stage"),
                            "content": event_payload.get("argument"),
                            "round_number": event_payload.get("round"),
                            "round": event_payload.get("round"),
                            "turn_number": event_payload.get("round"),
                            "validated": event_payload.get("fact_check_passed"),
                            "timestamp": event_payload.get("timestamp"),
                        }
                        yield f"data: {json.dumps(event)}\n\n"
                    elif event_type == "fact_check_update":
                        event = {
                            "type": "fact_check_update",
                            "debate_id": debate_id,
                            "speaker": event_payload.get("speaker"),
                            "validated": event_payload.get("fact_check_passed"),
                            "timestamp": event_payload.get("timestamp"),
                        }
                        yield f"data: {json.dumps(event)}\n\n"
                    
                    queue.task_done()
                except asyncio.TimeoutError:
                    # Stream still active but waiting for node execution — send keepalive
                    yield f"data: {json.dumps({'type': 'ping'})}\n\n"

            # ── 3. Get final result safely (capture task exceptions)
            try:
                result = task.result()
            except asyncio.CancelledError:
                # Task was cancelled
                yield f"data: {json.dumps({'type': 'error', 'message': 'Debate task cancelled.'})}\n\n"
                yield f"data: {json.dumps({'type': 'complete'})}\n\n"
                return
            except Exception as task_err:
                import traceback
                print(f"Debate task failed: {traceback.format_exc()}")
                yield f"data: {json.dumps({'type': 'error', 'message': str(task_err)})}\n\n"
                yield f"data: {json.dumps({'type': 'complete'})}\n\n"
                return

            messages = result.get("messages", [])

            # ── 4. Determine winner ───────────────────────────────────────
            final_msg_content = messages[-1]["content"] if messages else ""
            winner = parse_winner_from_message(final_msg_content)
            disqualified = result.get("disqualified")

            # ── 5. Export CSV ─────────────────────────────────────────────
            try:
                req_logger.export_csv(debate_id)
            except Exception as csv_err:
                print(f"CSV export failed (non-critical): {csv_err}")

            # ── 6. Send done event ────────────────────────────────────────
            yield f"data: {json.dumps({
                'type': 'done',
                'debate_id': debate_id,
                'winner': winner,
                'disqualified': disqualified,
                'total_rounds': result.get('round_number', 1),
                'total_messages': len(messages),
            })}\n\n"

            # ── 7. Signal completion (helps frontend stop loading spinners) ──
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except asyncio.CancelledError:
            # Client disconnected (SSE connection loss) — actively cancel background graph execution
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except Exception:
                    pass
        except Exception as e:
            import traceback
            print(f"Debate stream error: {traceback.format_exc()}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/debate/{debate_id}/transcript")
async def get_transcript(debate_id: str):
    """Returns the full transcript for a debate."""
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

    messages = []
    for row in rows:
        messages.append({
            "id": row["id"],
            "debate_id": row["debate_id"],
            "topic": row["topic"],
            "round_number": row["round"],
            "round": row["round"],
            "turn_number": row["round"],
            "speaker": row["speaker"],
            "stage": row["stage"],
            "content": row["argument"],
            "validated": bool(row["fact_check_passed"]) if row["fact_check_passed"] is not None else None,
            "timestamp": row["timestamp"],
        })

    return {
        "debate_id": debate_id,
        "topic": messages[0]["topic"] if messages else "",
        "messages": messages,
        "total": len(messages),
    }


@app.get("/debates")
async def list_debates():
    """Returns a summary list of all past debates, newest first."""
    import sqlite3
    conn = sqlite3.connect(transcript_logger.db_path)
    conn.row_factory = sqlite3.Row

    rows = conn.execute("""
        SELECT
            debate_id,
            topic,
            MIN(timestamp) as started_at,
            COUNT(*)       as total_messages,
            MAX(round)     as total_rounds,
            MAX(CASE WHEN speaker = 'judge' THEN argument ELSE '' END) as verdict
        FROM debates
        GROUP BY debate_id
        ORDER BY started_at DESC
    """).fetchall()
    conn.close()

    debates = []
    for row in rows:
        d = dict(row)
        verdict = d.pop("verdict", "") or ""
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