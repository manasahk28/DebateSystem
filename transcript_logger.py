import csv, sqlite3, json, os, asyncio
from datetime import datetime
from typing import Optional, Any

class TranscriptLogger:
    def __init__(self, db_path="debates.db", csv_path="transcripts/", event_queue: Optional[Any] = None):
        self.db_path = db_path
        self.csv_path = csv_path
        self.event_queue = event_queue
        os.makedirs(self.csv_path, exist_ok=True)
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS debates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                debate_id TEXT,
                topic TEXT,
                round INTEGER,
                speaker TEXT,
                stage TEXT,
                argument TEXT,
                fact_check_passed BOOLEAN,
                timestamp TEXT
            )
        """)
        conn.commit()
        conn.close()

    def log_turn(self, debate_id, topic, round_num, speaker, stage, argument, fact_check_passed):
        conn = sqlite3.connect(self.db_path)
        conn.execute("INSERT INTO debates VALUES (NULL,?,?,?,?,?,?,?,?)",
            (debate_id, topic, round_num, speaker, stage, argument,
             fact_check_passed, datetime.now().isoformat()))
        conn.commit()
        conn.close()

        if self.event_queue is not None:
            payload = {
                "event": "turn",
                "debate_id": debate_id,
                "topic": topic,
                "round": round_num,
                "speaker": speaker,
                "stage": stage,
                "argument": argument,
                "fact_check_passed": bool(fact_check_passed),
                "timestamp": datetime.now().isoformat(),
            }
            try:
                self.event_queue.put_nowait(payload)
            except Exception:
                pass

    def export_csv(self, debate_id):
        conn = sqlite3.connect(self.db_path)
        rows = conn.execute("SELECT * FROM debates WHERE debate_id=?", (debate_id,)).fetchall()
        with open(f"{self.csv_path}{debate_id}.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["id","debate_id","topic","round","speaker","stage","argument","fact_check","timestamp"])
            writer.writerows(rows)
        conn.close()