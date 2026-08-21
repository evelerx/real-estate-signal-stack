from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.ml_methodology import DEFAULT_MODEL_CONFIG  # noqa: E402


def _compact_text(*parts: str | None) -> str:
    return " ".join(str(part).strip() for part in parts if str(part or "").strip())


def build_model_config_from_mapping(mapping: dict) -> dict:
    paper = mapping.get("paper_identity", {})
    target = mapping.get("research_target", {})
    details = mapping.get("model_details", {})
    updates = mapping.get("config_updates", {})

    paper_title = str(paper.get("paper_title") or "").strip()
    algorithm = str(details.get("algorithm") or "").strip()
    model_family = str(details.get("model_family") or algorithm or DEFAULT_MODEL_CONFIG["model_family"]).strip()
    normalization = str(details.get("normalization") or DEFAULT_MODEL_CONFIG["normalization"]).strip()
    target_variable = str(target.get("target_variable") or "capital_allocation_score").strip()
    target_type = str(target.get("target_type") or "").strip()

    config = dict(DEFAULT_MODEL_CONFIG)
    config["feature_ranges"] = DEFAULT_MODEL_CONFIG["feature_ranges"] | updates.get("feature_ranges", {})
    config["feature_weights"] = DEFAULT_MODEL_CONFIG["feature_weights"] | updates.get("feature_weights", {})
    config["risk_logit_weights"] = DEFAULT_MODEL_CONFIG["risk_logit_weights"] | updates.get("risk_logit_weights", {})
    config["confidence_formula"] = DEFAULT_MODEL_CONFIG["confidence_formula"] | updates.get("confidence_formula", {})

    if updates.get("expected_training_columns"):
        config["expected_training_columns"] = updates["expected_training_columns"]

    config["source_status"] = "base_paper_aligned" if paper_title else "awaiting_base_paper"
    config["model_version"] = (
        f"paper-aligned-{paper.get('publication_year') or 'draft'}"
        if paper_title
        else DEFAULT_MODEL_CONFIG["model_version"]
    )
    config["model_family"] = model_family
    config["normalization"] = normalization
    config["score_formula"] = _compact_text(
        f"{model_family} model for {target_variable}.",
        f"Target type: {target_type}." if target_type else "",
        f"Algorithm: {algorithm}." if algorithm else "",
    ) or DEFAULT_MODEL_CONFIG["score_formula"]
    config["risk_formula"] = updates.get("risk_formula") or DEFAULT_MODEL_CONFIG["risk_formula"]
    config["paper_alignment_note"] = (
        f"Aligned from base paper: {paper_title}."
        if paper_title
        else DEFAULT_MODEL_CONFIG["paper_alignment_note"]
    )
    return config


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate backend/config/model_config.json from a filled base-paper mapping file."
    )
    parser.add_argument("mapping", help="Path to filled base_paper_mapping JSON")
    parser.add_argument(
        "--output",
        default=str(BACKEND_DIR / "config" / "model_config.generated.json"),
        help="Output path for generated model config JSON",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print generated JSON without writing")
    args = parser.parse_args()

    mapping_path = Path(args.mapping)
    with mapping_path.open("r", encoding="utf-8") as handle:
        mapping = json.load(handle)

    config = build_model_config_from_mapping(mapping)
    payload = json.dumps(config, indent=2, sort_keys=False)

    if args.dry_run:
        print(payload)
        return 0

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(payload + "\n", encoding="utf-8")
    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
