import sys
from pathlib import Path

from fastapi import FastAPI

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from main import app as backend_app  # noqa: E402

app = FastAPI(title="Real Estate Signal Stack API")
app.mount("/api", backend_app)
