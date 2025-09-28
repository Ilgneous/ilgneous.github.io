import os
import json
import time
from pathlib import Path
from typing import Dict, Tuple

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from .emailer import send_contact_email, EmailConfigError

app = FastAPI(title="Portfolio API", version="1.1.0")

# ---------------- CORS ----------------
allowed = os.getenv("ALLOWED_ORIGINS")  # e.g. "https://yourname.github.io,https://yourname.com"
origins = [o.strip() for o in allowed.split(",")] if allowed else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------- Data ----------------
DATA = Path(__file__).parent / "data" / "projects.json"

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/projects")
def get_projects():
    if not DATA.exists():
        return []
    with open(DATA) as f:
        return json.load(f)

# ---------------- Contact ----------------
# (Optional) tiny IP rate limiter to avoid spam
WINDOW_SEC = 60
MAX_PER_WINDOW = 5
_hits: Dict[str, Tuple[int, float]] = {}  # ip -> (count, window_start)

def rate_limit(ip: str):
    now = time.time()
    count, start = _hits.get(ip, (0, now))
    if now - start > WINDOW_SEC:
        _hits[ip] = (1, now)
        return
    if count + 1 > MAX_PER_WINDOW:
        raise HTTPException(status_code=429, detail="Too many requests, slow down.")
    _hits[ip] = (count + 1, start)

class Contact(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    message: str = Field(min_length=5, max_length=5000)

@app.post("/api/contact")
async def contact(req: Request, c: Contact):
    # Basic rate limit
    ip = req.client.host if req.client else "unknown"
    rate_limit(ip)

    try:
        # Send the email via SendGrid (implemented in app/emailer.py)
        await send_contact_email(c.name, c.email, c.message)
    except EmailConfigError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Email send failed: {e}")

    return {"ok": True}