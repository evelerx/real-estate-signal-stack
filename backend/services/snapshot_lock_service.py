from datetime import datetime
from fastapi import HTTPException
from config import VALID_SNAPSHOTS


def is_snapshot_locked(snapshot_version: str) -> bool:
    snapshot = VALID_SNAPSHOTS.get(snapshot_version)
    if not snapshot:
        return True  # unknown snapshots are immutable
    return snapshot.get("locked", False)


def assert_snapshot_writable(snapshot_version: str):
    """
    Hard guard for any write operation.
    Raises HTTPException if snapshot is locked.
    """
    if is_snapshot_locked(snapshot_version):
        raise HTTPException(
            status_code=403,
            detail="Snapshot is locked; write operations are not allowed",
        )


def is_quarter_locked(quarter: str, snapshot_version: str) -> bool:
    """
    Quarter format: YYYY-QX

    Rules:
    - If snapshot is locked → all quarters locked
    - If quarter end < snapshot.to → locked
    """
    if is_snapshot_locked(snapshot_version):
        return True

    snapshot = VALID_SNAPSHOTS[snapshot_version]
    snapshot_end = datetime.fromisoformat(snapshot["to"])

    year, q = quarter.split("-Q")
    q = int(q)

    quarter_end_month = {1: 3, 2: 6, 3: 9, 4: 12}[q]
    quarter_end = datetime(int(year), quarter_end_month, 28)

    return quarter_end < snapshot_end
