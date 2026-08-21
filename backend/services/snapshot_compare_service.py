def compare_snapshots(area_id: str, snapshots: list, compute_fn):
    results = []

    for version in snapshots:
        snapshot = compute_fn(area_id, version)
        results.append({
            "snapshot_version": version,
            "final_score": snapshot["capital_allocation_score"],
            "confidence": snapshot["confidence"],
        })

    deltas = []
    for i in range(1, len(results)):
        deltas.append({
            "from": results[i - 1]["snapshot_version"],
            "to": results[i]["snapshot_version"],
            "score_delta": round(
                results[i]["final_score"] - results[i - 1]["final_score"], 2
            ),
        })

    return {
        "timeline": results,
        "deltas": deltas,
    }
