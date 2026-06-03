"""
SQLite persistence layer.

Plans are stored as JSON blobs — schema-free so adding fields to Plan never
requires a migration. The database file lives next to run.py (backend/).
"""

import json
import sqlite3
from pathlib import Path
from typing import Optional

from models import Plan

DB_PATH = Path(__file__).parent / "kitchenforge.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS plans (
                id         TEXT PRIMARY KEY,
                data       TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)


def save_plan(plan: Plan) -> None:
    with _connect() as conn:
        conn.execute("""
            INSERT INTO plans (id, data, created_at, updated_at)
            VALUES (:id, :data, :created_at, :updated_at)
            ON CONFLICT(id) DO UPDATE SET
                data       = excluded.data,
                updated_at = excluded.updated_at
        """, {
            "id": plan.id,
            "data": json.dumps(plan.to_dict()),
            "created_at": plan.created_at,
            "updated_at": plan.updated_at,
        })


def get_plan(plan_id: str) -> Optional[Plan]:
    with _connect() as conn:
        row = conn.execute("SELECT data FROM plans WHERE id = ?", (plan_id,)).fetchone()
    if row is None:
        return None
    return Plan.from_dict(json.loads(row["data"]))


def list_plans() -> list[Plan]:
    with _connect() as conn:
        rows = conn.execute("SELECT data FROM plans ORDER BY created_at").fetchall()
    return [Plan.from_dict(json.loads(r["data"])) for r in rows]


def delete_plan(plan_id: str) -> bool:
    with _connect() as conn:
        cursor = conn.execute("DELETE FROM plans WHERE id = ?", (plan_id,))
    return cursor.rowcount > 0
