from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from services.db import get_db

router = APIRouter(prefix="/areas", tags=["Heatmap"])

SQL = """
SELECT
  area,
  city,
  COUNT(*) AS cnt,
  AVG(score) AS raw_score
FROM area_scores
WHERE (:city IS NULL OR city = :city)
GROUP BY area, city;
"""

@router.get("/heatmap")
def heatmap(city: str | None = None, db: Session = Depends(get_db)):
    rows = db.execute(text(SQL), {"city": city}).fetchall()

    scores = [r.raw_score for r in rows]
    lo, hi = min(scores), max(scores)

    def norm(x):
        return (x - lo) / (hi - lo) if hi > lo else 0.5

    return [
        {
            "area": r.area,
            "city": r.city,
            "score": round(norm(r.raw_score), 3)
        }
        for r in rows
    ]
