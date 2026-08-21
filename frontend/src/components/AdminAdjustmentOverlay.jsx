import { useState } from "react";
import {
  saveAnalystAdjustments,
  saveAnalystNote,
} from "../services/api";

/**
 * Props:
 * - data: [{ quarter, score, adjusted, locked }]
 * - area: string
 * - snapshotVersion: string
 * - analystId: string
 * - onApply(adjustments)
 */
export default function AdminAdjustmentOverlay({
  data,
  area,
  snapshotVersion,
  analystId,
  onApply,
}) {
  const [adjustments, setAdjustments] = useState({});
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(false);

  function updateDelta(quarter, value) {
    setAdjustments((prev) => ({
      ...prev,
      [quarter]: Number(value),
    }));
  }

  function updateNote(quarter, value) {
    setNotes((prev) => ({
      ...prev,
      [quarter]: value,
    }));
  }

  function validate() {
    for (const q of Object.keys(adjustments)) {
      const delta = adjustments[q];
      if (delta !== 0 && !notes[q]?.trim()) {
        alert(`Justification note required for ${q}`);
        return false;
      }
    }
    return true;
  }

  async function apply() {
    if (!validate()) return;

    try {
      setSaving(true);

      // 1️⃣ Save notes first (X-G compliance)
      for (const quarter of Object.keys(adjustments)) {
        if (adjustments[quarter] !== 0) {
          await saveAnalystNote({
            area,
            quarter,
            note: notes[quarter],
            snapshotVersion,
            analystId,
          });
        }
      }

      // 2️⃣ Save adjustments
      await saveAnalystAdjustments(area, adjustments);

      onApply(adjustments);
      alert("Adjustments & notes saved");
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to save analyst inputs");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-overlay">
      <h4>Manual Analyst Adjustments</h4>

      {data.map((d) => {
        const locked = d.locked === true;

        return (
          <div
            key={d.quarter}
            className={`adjust-row ${locked ? "locked" : ""}`}
          >
            <span>{d.quarter}</span>

            <input
              type="number"
              step="0.5"
              placeholder="Δ"
              disabled={locked}
              value={adjustments[d.quarter] || ""}
              onChange={(e) =>
                updateDelta(d.quarter, e.target.value)
              }
            />

            <textarea
              placeholder={
                locked
                  ? "Locked quarter"
                  : "Justification (required if adjusted)"
              }
              disabled={locked}
              value={notes[d.quarter] || ""}
              onChange={(e) =>
                updateNote(d.quarter, e.target.value)
              }
            />

            {locked && (
              <span className="lock-indicator">🔒 Locked</span>
            )}
          </div>
        );
      })}

      <button onClick={apply} disabled={saving}>
        {saving ? "Saving…" : "Apply Adjustments"}
      </button>
    </div>
  );
}
