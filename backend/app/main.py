import os
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

app = FastAPI(title="Portfolio API", version="1.0.0")

# CORS: set ALLOWED_ORIGINS="https://yourname.github.io,https://yourname.com" in prod
allowed = os.getenv("ALLOWED_ORIGINS")
if allowed:
    origins = [o.strip() for o in allowed.split(",") if o.strip()]
else:
    origins = ["*"]  # dev default; tighten for production

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

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

class Contact(BaseModel):
    name: str
    email: EmailStr
    message: str

@app.post("/api/contact")
def contact(c: Contact):
    if len(c.message.strip()) < 5:
        raise HTTPException(status_code=400, detail="Message too short")
    # TODO: integrate email provider (Resend/SendGrid)
    return {"ok": True}

# Swagger UI available at /docs
