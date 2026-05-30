import csv, sqlite3, json, os, asyncio
from datetime import datetime
from typing import Optional, Any

class TranscriptLogger:
    def __init__(self, db_path=None, csv_path=None, event_queue: Optional[Any] = None, user_id: Optional[str] = None):
        self.db_path = db_path or os.getenv("DATABASE_PATH", "debates.db")
        self.csv_path = csv_path or os.getenv("CSV_PATH", "transcripts/")
        self.event_queue = event_queue
        self.user_id = user_id
        os.makedirs(self.csv_path, exist_ok=True)
        self._init_db()

    @property
    def is_postgres(self):
        db_url = os.getenv("DATABASE_URL")
        return bool(db_url and (db_url.startswith("postgresql://") or db_url.startswith("postgres://")))

    def query_db(self, query, params=None):
        """Executes a SELECT query and returns rows as a list of dicts."""
        is_pg = self.is_postgres
        if is_pg:
            query = query.replace("?", "%s")
            import psycopg2
            conn = psycopg2.connect(os.getenv("DATABASE_URL"))
            cur = conn.cursor()
        else:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            
        cur.execute(query, params or ())
        
        if is_pg:
            if cur.description:
                colnames = [desc[0] for desc in cur.description]
                rows = [dict(zip(colnames, row)) for row in cur.fetchall()]
            else:
                rows = []
        else:
            rows = [dict(row) for row in cur.fetchall()]
            
        conn.close()
        return rows

    def execute_write(self, query, params=None):
        """Executes an INSERT, UPDATE, or DELETE query and returns the lastrowid (SQLite only)."""
        is_pg = self.is_postgres
        if is_pg:
            query = query.replace("?", "%s")
            import psycopg2
            conn = psycopg2.connect(os.getenv("DATABASE_URL"))
            cur = conn.cursor()
        else:
            conn = sqlite3.connect(self.db_path)
            cur = conn.cursor()
            
        cur.execute(query, params or ())
        conn.commit()
        
        last_row_id = cur.lastrowid if not is_pg else None
        conn.close()
        return last_row_id

    def _init_db(self):
        is_pg = self.is_postgres
        auto_inc = "SERIAL PRIMARY KEY" if is_pg else "INTEGER PRIMARY KEY AUTOINCREMENT"
        
        query = f"""
            CREATE TABLE IF NOT EXISTS debates (
                id {auto_inc},
                debate_id TEXT,
                topic TEXT,
                round INTEGER,
                speaker TEXT,
                stage TEXT,
                argument TEXT,
                fact_check_passed BOOLEAN,
                timestamp TEXT,
                user_id TEXT
            )
        """
        self.execute_write(query)
        
        # Check if user_id column exists for backward compatibility
        if is_pg:
            check_cols = self.query_db("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'debates' AND column_name = 'user_id'
            """)
            if not check_cols:
                self.execute_write("ALTER TABLE debates ADD COLUMN user_id TEXT")
        else:
            check_cols = self.query_db("PRAGMA table_info(debates)")
            columns = [c["name"] for c in check_cols]
            if "user_id" not in columns:
                self.execute_write("ALTER TABLE debates ADD COLUMN user_id TEXT")

    def log_turn(self, debate_id, topic, round_num, speaker, stage, argument, fact_check_passed):
        query = """
            INSERT INTO debates 
            (debate_id, topic, round, speaker, stage, argument, fact_check_passed, timestamp, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (debate_id, topic, round_num, speaker, stage, argument, fact_check_passed, datetime.now().isoformat(), self.user_id)
        last_id = self.execute_write(query, params)
        
        if self.event_queue is not None:
            payload = {
                "event": "turn",
                "id": last_id or 0,
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

    def update_fact_check_status(self, debate_id, speaker, result):
        """
        Update the most recent turn for `debate_id` and `speaker` with the fact-check result.
        """
        if result is None:
            val = None
        elif isinstance(result, str):
            val = True if result.lower() == "yes" else False
        else:
            val = bool(result)

        query = """
            UPDATE debates
            SET fact_check_passed = ?
            WHERE id = (
                SELECT id FROM debates
                WHERE debate_id=? AND speaker=?
                ORDER BY id DESC
                LIMIT 1
            )
        """
        self.execute_write(query, (val, debate_id, speaker))

        if self.event_queue is not None:
            payload = {
                "event": "fact_check_update",
                "debate_id": debate_id,
                "speaker": speaker,
                "fact_check_passed": None if val is None else bool(val),
                "timestamp": datetime.now().isoformat(),
            }
            try:
                self.event_queue.put_nowait(payload)
            except Exception:
                pass

        return 1

    def export_csv(self, debate_id):
        rows = self.query_db("""
            SELECT id, debate_id, topic, round, speaker, stage, argument, fact_check_passed, timestamp, user_id
            FROM debates
            WHERE debate_id=?
            ORDER BY round, timestamp ASC
        """, (debate_id,))
        
        with open(f"{self.csv_path}{debate_id}.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["id","debate_id","topic","round","speaker","stage","argument","fact_check","timestamp","user_id"])
            for row in rows:
                writer.writerow([
                    row["id"], row["debate_id"], row["topic"], row["round"],
                    row["speaker"], row["stage"], row["argument"],
                    row["fact_check_passed"], row["timestamp"], row["user_id"]
                ])
            
            # Find the final verdict row (judge or moderator decision)
            verdict_text = ""
            for row in reversed(rows):
                if row["speaker"] in ("judge", "moderator"):
                    verdict_text = row["argument"]
                    break
            
            if verdict_text:
                import re
                winner_match = re.search(r"WINNER:\s*([A-Za-z]+)", verdict_text, re.IGNORECASE)
                winner_label = winner_match.group(1).strip().upper() if winner_match else "DRAW"
                
                # Check for disqualifications
                dis_match = re.search(r"DISQUALIFIED:\s*([A-Za-z]+)", verdict_text, re.IGNORECASE)
                if dis_match:
                    disqualified = dis_match.group(1).strip().upper()
                    winner_label = f"{'CON' if disqualified == 'PRO' else 'PRO'} WINS (AUTOMATED DISQUALIFICATION OF {disqualified})"
                
                reason_match = re.search(r"REASON:\s*([\s\S]+)", verdict_text, re.IGNORECASE)
                reason = reason_match.group(1).strip() if reason_match else verdict_text.strip()
                
                # Write a beautiful human-readable summary footer at the bottom of the CSV
                writer.writerow([])
                writer.writerow(["=========================================================================================="])
                writer.writerow(["DEBATE CONCLUSION SUMMARY"])
                writer.writerow(["=========================================================================================="])
                writer.writerow(["Decision Result", winner_label])
                writer.writerow(["Judge's Rationale & Conclusion", reason])
                writer.writerow(["=========================================================================================="])