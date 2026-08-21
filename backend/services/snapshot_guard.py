from fastapi import HTTPException

def enforce_snapshot_lock(snapshot_version: str, snapshots: dict):
    """
    Blocks write operations if snapshot is locked.
    """
    snapshot = snapshots.get(snapshot_version)

    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    if snapshot.get("locked"):
        raise HTTPException(
            status_code=423,
            detail=f"Snapshot {snapshot_version} is locked and immutable",
        )

