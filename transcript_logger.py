import csv, sqlite3, json, os, asyncio
from datetime import datetime
from typing import Optional, Any

class TranscriptLogger:
    def __init__(self, db_path="debates.db", csv_path="transcripts/", event_queue: Optional[Any] = None, user_id: Optional[str] = None):
        self.db_path = db_path
        self.csv_path = csv_path
        self.event_queue = event_queue
        self.user_id = user_id
        os.makedirs(self.csv_path, exist_ok=True)
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        try:
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
                    timestamp TEXT,
                    user_id TEXT
                )
            """)
            # Check if user_id column exists for backward compatibility
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(debates)")
            columns = [info[1] for info in cursor.fetchall()]
            if "user_id" not in columns:
                conn.execute("ALTER TABLE debates ADD COLUMN user_id TEXT")
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def log_turn(self, debate_id, topic, round_num, speaker, stage, argument, fact_check_passed):
        conn = sqlite3.connect(self.db_path)
        try:
            cur = conn.cursor()
            cur.execute("INSERT INTO debates VALUES (NULL,?,?,?,?,?,?,?,?,?)",
                (debate_id, topic, round_num, speaker, stage, argument,
                 fact_check_passed, datetime.now().isoformat(), self.user_id))
            conn.commit()
            last_id = cur.lastrowid
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

        if self.event_queue is not None:
            payload = {
                "event": "turn",
                "id": last_id,
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

        `result` may be a boolean or a string ('yes'/'no'). If `result` is None,
        the column will be set to NULL.
        Returns the number of rows updated (should be 1 when successful).
        """
        if result is None:
            val = None
        elif isinstance(result, str):
            val = True if result.lower() == "yes" else False
        else:
            val = bool(result)

        conn = sqlite3.connect(self.db_path)
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE debates
                SET fact_check_passed = ?
                WHERE id = (
                    SELECT id FROM debates
                    WHERE debate_id=? AND speaker=?
                    ORDER BY id DESC
                    LIMIT 1
                )
                """,
                (val, debate_id, speaker),
            )
            conn.commit()
            updated = cur.rowcount
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

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

        return updated

    def export_csv(self, debate_id):
        conn = sqlite3.connect(self.db_path)
        rows = conn.execute("""
            SELECT id, debate_id, topic, round, speaker, stage, argument, fact_check_passed, timestamp, user_id
            FROM debates
            WHERE debate_id=?
            ORDER BY round, timestamp ASC
        """, (debate_id,)).fetchall()
        with open(f"{self.csv_path}{debate_id}.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["id","debate_id","topic","round","speaker","stage","argument","fact_check","timestamp","user_id"])
            writer.writerows(rows)
            
            # Find the final verdict row (judge or moderator decision)
            verdict_text = ""
            for row in reversed(rows):
                if row[4] in ("judge", "moderator"):
                    verdict_text = row[6]
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
                
        conn.close()