"""Meridian Motors API — inquiries, appointments, curator session."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "meridian.db"
SECRET = os.environ.get("MERIDIAN_SECRET", "meridian-atelier-dev-key-change").encode()
ADMIN_EMAIL = "curator@meridian.motors"
ADMIN_PASSWORD = os.environ.get("MERIDIAN_ADMIN_PASSWORD", "Meridian#Curator")
TOKEN_TTL = 60 * 60 * 8

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
RATE: dict[str, deque[float]] = defaultdict(deque)

@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Meridian Motors API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8080", "http://localhost:8080"],
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    allow_credentials=True,
)


def clean(value: str | None, max_len: int) -> str:
    text = CTRL.sub("", (value or "")).strip()
    return text[:max_len]


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    return (request.client.host if request.client else "unknown")[:64]


def rate_limit(key: str, limit: int, window: int) -> None:
    now = time.time()
    bucket = RATE[key]
    while bucket and bucket[0] < now - window:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
    bucket.append(now)


def hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 180_000)
    return digest.hex()


def sign_token(subject: str) -> str:
    payload = json.dumps({"sub": subject, "role": "curator", "exp": int(time.time()) + TOKEN_TTL}, separators=(",", ":"))
    body = secrets.token_urlsafe(8) + "." + payload.encode().hex()
    sig = hmac.new(SECRET, body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{sig}"


def verify_token(token: str) -> dict[str, Any]:
    try:
        body, sig = token.rsplit(".", 1)
        expected = hmac.new(SECRET, body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            raise ValueError("bad sig")
        payload_hex = body.split(".", 1)[1]
        data = json.loads(bytes.fromhex(payload_hex))
        if int(data["exp"]) < int(time.time()):
            raise ValueError("expired")
        return data
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.") from exc


def require_curator(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    return verify_token(authorization.split(" ", 1)[1].strip())


@contextmanager
def db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS inquiries (
              id TEXT PRIMARY KEY,
              first_name TEXT NOT NULL,
              last_name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT NOT NULL,
              vehicle TEXT NOT NULL,
              message TEXT NOT NULL,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS appointments (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT NOT NULL,
              date TEXT NOT NULL,
              time TEXT NOT NULL,
              vehicle TEXT NOT NULL,
              notes TEXT NOT NULL,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )
        existing = conn.execute("SELECT COUNT(*) AS c FROM inquiries").fetchone()["c"]
        if existing == 0:
            seed_inquiries = [
                (
                    "inq_01",
                    "Daniel",
                    "Adler",
                    "daniel.adler@example.com",
                    "+1 (415) 555-0192",
                    "Mercedes-Benz S-Class S 580",
                    "Requesting a private viewing this week, preferably after 5pm.",
                    "new",
                    "2026-09-30T16:40:00.000Z",
                ),
                (
                    "inq_02",
                    "Priya",
                    "Shah",
                    "priya.shah@example.com",
                    "+1 (310) 555-0177",
                    "Albula GTS Coupe Classic",
                    "Is the Graphite Night example still available for a Saturday appointment?",
                    "open",
                    "2026-09-29T11:15:00.000Z",
                ),
                (
                    "inq_03",
                    "Thomas",
                    "Reeves",
                    "thomas.reeves@example.com",
                    "+1 (212) 555-0133",
                    "Porsche 911 GT3",
                    "Please send the dynamometer report and service book scans.",
                    "open",
                    "2026-09-28T09:05:00.000Z",
                ),
                (
                    "inq_04",
                    "Claire",
                    "Benoit",
                    "claire.benoit@example.com",
                    "+1 (617) 555-0188",
                    "Carterra Touring Edition",
                    "Interested in a trade evaluation against a 2021 Bentayga.",
                    "closed",
                    "2026-09-26T14:22:00.000Z",
                ),
            ]
            conn.executemany(
                "INSERT INTO inquiries VALUES (?,?,?,?,?,?,?,?,?)",
                seed_inquiries,
            )
            seed_appts = [
                (
                    "apt_01",
                    "Dr. Helena Voss",
                    "helena.voss@example.com",
                    "+1 (917) 555-0104",
                    "2026-10-04",
                    "10:30",
                    "Porsche 911 Carrera",
                    "Private inspection — GT Silver Carrera",
                    "confirmed",
                    "2026-09-27T12:00:00.000Z",
                ),
                (
                    "apt_02",
                    "James Whitford",
                    "j.whitford@example.com",
                    "+1 (415) 555-0160",
                    "2026-10-04",
                    "14:00",
                    "Albula GTS Coupe Classic",
                    "Second viewing with partner",
                    "confirmed",
                    "2026-09-28T08:30:00.000Z",
                ),
                (
                    "apt_03",
                    "Sofia Marin",
                    "sofia.marin@example.com",
                    "+1 (310) 555-0129",
                    "2026-10-05",
                    "11:00",
                    "Mercedes-Benz S-Class S 580",
                    "Delivery walkthrough",
                    "pending",
                    "2026-09-29T17:45:00.000Z",
                ),
                (
                    "apt_04",
                    "Arthur Chen",
                    "arthur.chen@example.com",
                    "+1 (650) 555-0181",
                    "2026-10-06",
                    "16:30",
                    "Vangelis Class S",
                    "Financing discussion + viewing",
                    "confirmed",
                    "2026-09-30T10:10:00.000Z",
                ),
            ]
            conn.executemany(
                "INSERT INTO appointments VALUES (?,?,?,?,?,?,?,?,?,?)",
                seed_appts,
            )


@app.middleware("http")
async def security_headers(request: Request, call_next):  # type: ignore[no-untyped-def]
    if request.method == "POST" and request.headers.get("content-type", "").split(";")[0].strip() not in {
        "application/json",
        "",
    }:
        if request.url.path.startswith("/api/"):
            return JSONResponse({"detail": "Unsupported content type."}, status_code=415)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cache-Control"] = "no-store"
    return response


class InquiryIn(BaseModel):
    firstName: str = Field(min_length=1, max_length=60)
    lastName: str = Field(min_length=1, max_length=60)
    email: str = Field(min_length=5, max_length=120)
    phone: str = Field(min_length=7, max_length=32)
    vehicle: str = Field(default="", max_length=120)
    message: str = Field(min_length=8, max_length=2000)


class AppointmentIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=120)
    phone: str = Field(min_length=7, max_length=32)
    date: str = Field(min_length=8, max_length=12)
    time: str = Field(min_length=4, max_length=8)
    vehicle: str = Field(default="", max_length=120)
    notes: str = Field(default="", max_length=1000)


class LoginIn(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class StatusIn(BaseModel):
    status: str = Field(min_length=3, max_length=20)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"ok": "meridian"}


@app.post("/api/auth/login")
def login(payload: LoginIn, request: Request) -> dict[str, Any]:
    rate_limit(f"login:{client_ip(request)}", 6, 300)
    email = clean(str(payload.email), 120).lower()
    password = payload.password
    salt = "meridian-atelier"
    expected = hash_password(ADMIN_PASSWORD, salt)
    given = hash_password(password, salt)
    if email != ADMIN_EMAIL or not hmac.compare_digest(expected, given):
        time.sleep(0.25)
        raise HTTPException(status_code=401, detail="Those credentials were not recognised.")
    token = sign_token(email)
    return {"token": token, "curator": {"email": email, "name": "Atelier Curator"}}


@app.get("/api/auth/me")
def me(curator: dict[str, Any] = Depends(require_curator)) -> dict[str, Any]:
    return {"curator": {"email": curator["sub"], "name": "Atelier Curator"}}


@app.post("/api/inquiries")
def create_inquiry(payload: InquiryIn, request: Request) -> dict[str, str]:
    rate_limit(f"inq:{client_ip(request)}", 8, 3600)
    first = clean(payload.firstName, 60)
    last = clean(payload.lastName, 60)
    email = clean(str(payload.email), 120).lower()
    phone = clean(payload.phone, 32)
    vehicle = clean(payload.vehicle, 120)
    message = clean(payload.message, 2000)
    if not EMAIL_RE.match(email) or not first or not last or len(message) < 8:
        raise HTTPException(status_code=422, detail="Please complete every required field.")
    now = datetime.now(timezone.utc).isoformat()
    ident = "inq_" + secrets.token_hex(6)
    with db() as conn:
        conn.execute(
            "INSERT INTO inquiries VALUES (?,?,?,?,?,?,?,?,?)",
            (ident, first, last, email, phone, vehicle, message, "new", now),
        )
    return {"id": ident, "status": "received"}


@app.get("/api/inquiries")
def list_inquiries(_curator: dict[str, Any] = Depends(require_curator)) -> dict[str, Any]:
    with db() as conn:
        rows = conn.execute("SELECT * FROM inquiries ORDER BY created_at DESC").fetchall()
    items = [
        {
            "id": r["id"],
            "firstName": r["first_name"],
            "lastName": r["last_name"],
            "email": r["email"],
            "phone": r["phone"],
            "vehicle": r["vehicle"],
            "message": r["message"],
            "status": r["status"],
            "createdAt": r["created_at"],
        }
        for r in rows
    ]
    return {"inquiries": items}


@app.patch("/api/inquiries/{ident}")
def patch_inquiry(ident: str, payload: StatusIn, _curator: dict[str, Any] = Depends(require_curator)) -> dict[str, str]:
    status = clean(payload.status, 20)
    if status not in {"new", "open", "closed"}:
        raise HTTPException(status_code=422, detail="Unknown status.")
    with db() as conn:
        cur = conn.execute("UPDATE inquiries SET status=? WHERE id=?", (status, ident))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Enquiry not found.")
    return {"id": ident, "status": status}


@app.post("/api/appointments")
def create_appointment(payload: AppointmentIn, request: Request) -> dict[str, str]:
    rate_limit(f"apt:{client_ip(request)}", 8, 3600)
    name = clean(payload.name, 80)
    email = clean(str(payload.email), 120).lower()
    phone = clean(payload.phone, 32)
    date = clean(payload.date, 12)
    time_val = clean(payload.time, 8)
    vehicle = clean(payload.vehicle, 120)
    notes = clean(payload.notes, 1000)
    if not EMAIL_RE.match(email) or not name or not date or not time_val:
        raise HTTPException(status_code=422, detail="Please complete every required field.")
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", date):
        raise HTTPException(status_code=422, detail="Please choose a valid date.")
    now = datetime.now(timezone.utc).isoformat()
    ident = "apt_" + secrets.token_hex(6)
    with db() as conn:
        conn.execute(
            "INSERT INTO appointments VALUES (?,?,?,?,?,?,?,?,?,?)",
            (ident, name, email, phone, date, time_val, vehicle, notes, "pending", now),
        )
    return {"id": ident, "status": "received"}


@app.get("/api/appointments")
def list_appointments(_curator: dict[str, Any] = Depends(require_curator)) -> dict[str, Any]:
    with db() as conn:
        rows = conn.execute("SELECT * FROM appointments ORDER BY date ASC, time ASC").fetchall()
    items = [
        {
            "id": r["id"],
            "name": r["name"],
            "email": r["email"],
            "phone": r["phone"],
            "date": r["date"],
            "time": r["time"],
            "vehicle": r["vehicle"],
            "notes": r["notes"],
            "status": r["status"],
            "createdAt": r["created_at"],
        }
        for r in rows
    ]
    return {"appointments": items}


@app.patch("/api/appointments/{ident}")
def patch_appointment(
    ident: str, payload: StatusIn, _curator: dict[str, Any] = Depends(require_curator)
) -> dict[str, str]:
    status = clean(payload.status, 20)
    if status not in {"confirmed", "pending", "completed"}:
        raise HTTPException(status_code=422, detail="Unknown status.")
    with db() as conn:
        cur = conn.execute("UPDATE appointments SET status=? WHERE id=?", (status, ident))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Appointment not found.")
    return {"id": ident, "status": status}


@app.get("/api/stats")
def stats(_curator: dict[str, Any] = Depends(require_curator)) -> dict[str, int]:
    with db() as conn:
        inquiries = conn.execute("SELECT COUNT(*) AS c FROM inquiries").fetchone()["c"]
        open_inq = conn.execute(
            "SELECT COUNT(*) AS c FROM inquiries WHERE status != 'closed'"
        ).fetchone()["c"]
        appts = conn.execute("SELECT COUNT(*) AS c FROM appointments").fetchone()["c"]
    return {
        "inquiries": inquiries,
        "openInquiries": open_inq,
        "appointments": appts,
    }
