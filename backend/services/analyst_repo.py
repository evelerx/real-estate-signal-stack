import sqlite3
import json

DB = "analyst_flags.db"

def save_flags(area, snapshot, analyst_id, flags):
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT OR REPLACE INTO analyst_flags
        VALUES (?, ?, ?, ?, datetime('now'))
        """,
        (area, snapshot, analyst_id, json.dumps(flags)),
    )
    conn.commit()
    conn.close()

def load_flags(area, snapshot):
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    cur.execute(
        "SELECT flags_json FROM analyst_flags WHERE area=? AND snapshot_version=?",
        (area, snapshot),
    )
    row = cur.fetchone()
    conn.close()
    return json.loads(row[0]) if row else None
