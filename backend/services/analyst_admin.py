from fastapi import APIRouter, Query, HTTPException
from datetime import datetime
from typing import Dict, Any

from config import VALID_SNAPSHOTS
from schemas.analyst import AnalystFlagInput
from schemas.analyst_notes import AnalystNoteInput

from services.snapshot_lock_service import (
    is_snapshot_locked,
    is_quarter_locked,
    assert_snapshot_writable,
)

# ===============================
# 🔐 ANALYST ADJUSTMENT REGISTRY
# (REQUIRED BY main.py IMPORT)
# ===============================

ANALYST_ADJUSTMENTS: Dict[str, Any] = {
    "UPDATE_AREA_FLAGS": {
        "description": "Modify analyst flags for an area",
        "roles": ["analyst", "admin"],
    },
    "ADD_ANALYST_NOTE": {
        "description": "Add analyst justification notes",
        "roles": ["analyst", "admin"],
    },
}

# ===============================
# ROUTER
# ===============================

router = APIRouter(
    prefix="/internal/analyst",
    tags=["Internal Analyst"],
)

# ===============================
# IN-MEMORY STORAGE
# ===============================

_ANALYST_FLAGS: Dict[str, Dict[str, Dict]] = {}
_ANALYST_NOTES: Dict[str, Dict[str, Dict]] = {}

# ===============================
# FLAG ROUTES
# ===============================

@router.post("/area/{area_id}")
def update_area_flags(
    area_id: str,
    flags: AnalystFlagInput,
    analyst_id: str = Query(...),
    snapshot_version: str = Query(...),
):
    if snapshot_version not in VALID_SNAPSHOTS:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    # 🔒 Enforce snapshot immutability
    assert_snapshot_writable(snapshot_version)

    area_key = area_id.lower()

    _ANALYST_FLAGS.setdefault(area_key, {})
    _ANALYST_FLAGS[area_key][snapshot_version] = {
        "flags": flags.dict(exclude_unset=True),
        "analyst_id": analyst_id,
        "timestamp": datetime.utcnow().isoformat(),
    }

    return {
        "status": "saved",
        "area": area_key,
        "snapshot_version": snapshot_version,
        "flags": _ANALYST_FLAGS[area_key][snapshot_version]["flags"],
    }


@router.get("/area/{area_id}")
def get_area_flags(
    area_id: str,
    snapshot_version: str = Query(...),
):
    return (
        _ANALYST_FLAGS
        .get(area_id.lower(), {})
        .get(snapshot_version, {})
    )

# ===============================
# NOTES ROUTES
# ===============================

@router.post("/area/{area_id}/notes")
def save_analyst_note(
    area_id: str,
    payload: AnalystNoteInput,
    analyst_id: str = Query(...),
    snapshot_version: str = Query(...),
):
    # 🔒 Quarter-level locking
    if is_quarter_locked(payload.quarter, snapshot_version):
        raise HTTPException(
            status_code=403,
            detail="Quarter is locked; notes cannot be modified",
        )

    area_key = area_id.lower()

    _ANALYST_NOTES.setdefault(area_key, {})
    _ANALYST_NOTES[area_key][payload.quarter] = {
        "note": payload.note,
        "analyst_id": analyst_id,
        "snapshot_version": snapshot_version,
        "timestamp": datetime.utcnow().isoformat(),
    }

    return {
        "status": "saved",
        "area": area_key,
        "quarter": payload.quarter,
    }


@router.get("/area/{area_id}/notes")
def get_analyst_notes(
    area_id: str,
    snapshot_version: str = Query(...),
):
    notes = _ANALYST_NOTES.get(area_id.lower(), {})
    return {
        q: v
        for q, v in notes.items()
        if v["snapshot_version"] == snapshot_version
    }
