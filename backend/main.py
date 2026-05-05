import os
import json
import uuid
import random
from datetime import datetime, timedelta
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import jwt
from aiosqlite import connect

# Configuration
DATABASE_PATH = "/root/mooyu-h5/backend/mooyu.db"
SECRET_KEY = "mooyu_secret_key_2024_very_secure"
ALGORITHM = "HS256"
API_HOST = "0.0.0.0"
API_PORT = 8000

# Daily quotes
DAILY_QUOTES = [
    {"text": "摸鱼一时爽，一直摸鱼一直爽", "author": "职场前辈"},
    {"text": "上班的目的就是不上班", "author": "FIRE运动"},
    {"text": "摸鱼是给老板最大的尊重", "author": "摸鱼达人"},
    {"text": "今天能完成的工作绝不拖到明天", "author": "摆烂王"},
    {"text": "效率是关键，所以要速战速决", "author": "时间管理大师"},
    {"text": "打工是为了更好的摸鱼", "author": "职场哲学家"},
    {"text": "能躺着绝不坐着，能摸鱼绝不含糊", "author": "咸鱼本鱼"},
    {"text": "工作只是生活的调味剂", "author": "佛系青年"},
]

# Achievement definitions
ACHIEVEMENT_DEFS = {
    "first_incident": {"name": "初出茅庐", "desc": "记录你的第一次摸鱼事件", "icon": "🌟"},
    "ten_incidents": {"name": "摸鱼老手", "desc": "累计记录10次摸鱼事件", "icon": "🐟"},
    "fifty_incidents": {"name": "摸鱼大师", "desc": "累计记录50次摸鱼事件", "icon": "🐠"},
    "hundred_incidents": {"name": "摸鱼传奇", "desc": "累计记录100次摸鱼事件", "icon": "🦈"},
    "streak_7": {"name": "一周不倒", "desc": "连续7天记录摸鱼", "icon": "🔥"},
    "streak_30": {"name": "月度坚守", "desc": "连续30天记录摸鱼", "icon": "💎"},
    "overtime_king": {"name": "加班之王", "desc": "记录10次加班摸鱼", "icon": "👑"},
    "meeting_survivor": {"name": "会议幸存者", "desc": "成功从无聊会议中摸鱼10次", "icon": "🏆"},
    "perfect_week": {"name": "完美摸鱼周", "desc": "一周每天都有摸鱼记录", "icon": "⭐"},
    "buddy_found": {"name": "找到搭档", "desc": "匹配到一个摸鱼搭档", "icon": "🤝"},
    "buddy_cover": {"name": "互相掩护", "desc": "成功为搭档打掩护", "icon": "🛡️"},
    "all_types": {"name": "全能选手", "desc": "解锁所有摸鱼类型", "icon": "🎯"},
}

# Pydantic models
class UserCreate(BaseModel):
    device_id: str
    profile: Optional[dict] = {}

class UserProfileUpdate(BaseModel):
    industry: Optional[str] = None
    level: Optional[str] = None
    overtime: Optional[str] = None
    style: Optional[str] = None
    workYears: Optional[str] = None

class IncidentCreate(BaseModel):
    type: str
    description: str
    escaped: int = 1

class BuddyMatch(BaseModel):
    prefer_industry: Optional[str] = None

# Database helper - returns list of dicts
async def query_db(sql, params=()):
    async with connect(DATABASE_PATH) as db:
        db.row_factory = lambda c, r: {col[0]: val for col, val in zip(c.description, r)}
        cursor = await db.execute(sql, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

async def query_one(sql, params=()):
    async with connect(DATABASE_PATH) as db:
        db.row_factory = lambda c, r: {col[0]: val for col, val in zip(c.description, r)}
        cursor = await db.execute(sql, params)
        row = await cursor.fetchone()
        return dict(row) if row else None

async def execute_db(sql, params=()):
    async with connect(DATABASE_PATH) as db:
        await db.execute(sql, params)
        await db.commit()

async def init_db():
    await execute_db("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            created_at TEXT,
            profile TEXT,
            is_premium INTEGER DEFAULT 0,
            last_visit TEXT
        )
    """)
    await execute_db("""
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            type TEXT,
            description TEXT,
            date TEXT,
            escaped INTEGER DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    await execute_db("""
        CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            achievement_id TEXT,
            unlocked_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    await execute_db("""
        CREATE TABLE IF NOT EXISTS buddies (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            partner_id TEXT,
            partner_profile TEXT,
            match_score INTEGER,
            matched_at TEXT,
            expires_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

def create_token(device_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=30)
    payload = {"sub": device_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    await init_db()
    print(f"Database initialized at {DATABASE_PATH}")
    yield
    print("Shutting down...")

app = FastAPI(title="摸鱼宝 API", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === USER ENDPOINTS ===

@app.post("/api/users")
async def create_or_get_user(data: UserCreate):
    existing = await query_one("SELECT * FROM users WHERE id = ?", (data.device_id,))
    if existing:
        await execute_db("UPDATE users SET last_visit = ? WHERE id = ?", 
                        (datetime.now().isoformat(), data.device_id))
        token = create_token(data.device_id)
        return {"user": existing, "token": token}
    
    now = datetime.now().isoformat()
    profile = json.dumps(data.profile) if data.profile else '{}'
    await execute_db(
        "INSERT INTO users (id, created_at, profile, last_visit) VALUES (?, ?, ?, ?)",
        (data.device_id, now, profile, now)
    )
    new_user = await query_one("SELECT * FROM users WHERE id = ?", (data.device_id,))
    token = create_token(data.device_id)
    return {"user": new_user, "token": token}

@app.get("/api/users/me")
async def get_me(x_device_id: str = Header(...)):
    user = await query_one("SELECT * FROM users WHERE id = ?", (x_device_id,))
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user

@app.get("/api/users/profile")
async def get_profile(x_device_id: str = Header(...)):
    user = await query_one("SELECT profile FROM users WHERE id = ?", (x_device_id,))
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return json.loads(user['profile'] or '{}')

@app.put("/api/users/profile")
async def update_profile(updates: UserProfileUpdate, x_device_id: str = Header(...)):
    user = await query_one("SELECT profile FROM users WHERE id = ?", (x_device_id,))
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    current_profile = json.loads(user['profile'] or '{}')
    update_data = updates.model_dump(exclude_unset=True)
    current_profile.update(update_data)
    
    await execute_db("UPDATE users SET profile = ? WHERE id = ?", 
                    (json.dumps(current_profile), x_device_id))
    return current_profile

# === INCIDENT ENDPOINTS ===

@app.get("/api/incidents")
async def get_incidents(
    x_device_id: str = Header(...),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = None
):
    offset = (page - 1) * limit
    if type:
        items = await query_db(
            "SELECT * FROM incidents WHERE user_id = ? AND type = ? ORDER BY date DESC LIMIT ? OFFSET ?",
            (x_device_id, type, limit, offset)
        )
        total = await query_one(
            "SELECT COUNT(*) as c FROM incidents WHERE user_id = ? AND type = ?",
            (x_device_id, type)
        )
    else:
        items = await query_db(
            "SELECT * FROM incidents WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?",
            (x_device_id, limit, offset)
        )
        total = await query_one(
            "SELECT COUNT(*) as c FROM incidents WHERE user_id = ?",
            (x_device_id,)
        )
    
    return {"items": items, "total": total['c'], "page": page, "limit": limit}

@app.post("/api/incidents")
async def create_incident(data: IncidentCreate, x_device_id: str = Header(...)):
    now = datetime.now().isoformat()
    incident_id = str(uuid.uuid4())
    await execute_db(
        "INSERT INTO incidents (id, user_id, type, description, date, escaped) VALUES (?, ?, ?, ?, ?, ?)",
        (incident_id, x_device_id, data.type, data.description, now, data.escaped)
    )
    row = await query_one("SELECT * FROM incidents WHERE id = ?", (incident_id,))
    return row

# === ACHIEVEMENT ENDPOINTS ===

@app.get("/api/achievements")
async def get_achievements(x_device_id: str = Header(...)):
    unlocked_rows = await query_db(
        "SELECT * FROM achievements WHERE user_id = ?",
        (x_device_id,)
    )
    unlocked = {r['achievement_id']: r['unlocked_at'] for r in unlocked_rows}
    
    result = []
    for aid, info in ACHIEVEMENT_DEFS.items():
        result.append({
            "id": aid,
            "name": info["name"],
            "desc": info["desc"],
            "icon": info["icon"],
            "unlocked": aid in unlocked,
            "unlocked_at": unlocked.get(aid)
        })
    return result

@app.post("/api/achievements/check")
async def check_achievements(x_device_id: str = Header(...)):
    incident_count = await query_one(
        "SELECT COUNT(*) as c FROM incidents WHERE user_id = ?",
        (x_device_id,)
    )
    overtime_count = await query_one(
        "SELECT COUNT(*) as c FROM incidents WHERE user_id = ? AND type = 'overtime'",
        (x_device_id,)
    )
    meeting_count = await query_one(
        "SELECT COUNT(*) as c FROM incidents WHERE user_id = ? AND type = 'meeting'",
        (x_device_id,)
    )
    buddy = await query_one("SELECT * FROM buddies WHERE user_id = ?", (x_device_id,))
    
    types = await query_db(
        "SELECT DISTINCT type FROM incidents WHERE user_id = ?",
        (x_device_id,)
    )
    has_all_types = len(types) >= 7
    
    unlocked_ids = []
    checks = {
        "first_incident": incident_count['c'] >= 1,
        "ten_incidents": incident_count['c'] >= 10,
        "fifty_incidents": incident_count['c'] >= 50,
        "hundred_incidents": incident_count['c'] >= 100,
        "overtime_king": overtime_count['c'] >= 10,
        "meeting_survivor": meeting_count['c'] >= 10,
        "all_types": has_all_types,
        "buddy_found": buddy is not None,
    }
    
    for aid, condition in checks.items():
        if condition:
            existing = await query_one(
                "SELECT * FROM achievements WHERE user_id = ? AND achievement_id = ?",
                (x_device_id, aid)
            )
            if not existing:
                now = datetime.now().isoformat()
                await execute_db(
                    "INSERT INTO achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)",
                    (str(uuid.uuid4()), x_device_id, aid, now)
                )
                unlocked_ids.append(aid)
    
    return {"newly_unlocked": unlocked_ids}

# === BUDDY ENDPOINTS ===

@app.get("/api/buddy")
async def get_buddy(x_device_id: str = Header(...)):
    buddy = await query_one("SELECT * FROM buddies WHERE user_id = ?", (x_device_id,))
    return buddy

@app.post("/api/buddy/match")
async def match_buddy(prefs: BuddyMatch, x_device_id: str = Header(...)):
    existing = await query_one("SELECT * FROM buddies WHERE user_id = ?", (x_device_id,))
    if existing:
        return existing
    
    now = datetime.now().isoformat()
    expires = (datetime.now() + timedelta(days=7)).isoformat()
    
    buddy_profiles = [
        {"name": "摸鱼小明", "industry": "互联网", "level": "P6", "style": "低调型"},
        {"name": "摸鱼小红", "industry": "金融", "level": "Senior", "style": "活跃型"},
        {"name": "摸鱼阿强", "industry": "科技", "level": "Manager", "style": "稳健型"},
    ]
    partner = random.choice(buddy_profiles)
    
    buddy_id = str(uuid.uuid4())
    match_score = random.randint(70, 98)
    
    await execute_db(
        """INSERT INTO buddies (id, user_id, partner_id, partner_profile, match_score, matched_at, expires_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (buddy_id, x_device_id, f"mock_{buddy_id}", json.dumps(partner), match_score, now, expires)
    )
    
    row = await query_one("SELECT * FROM buddies WHERE id = ?", (buddy_id,))
    return row

@app.post("/api/buddy/cover")
async def send_cover(x_device_id: str = Header(...)):
    return {"success": True, "message": "掩护已发送！🐟"}

@app.delete("/api/buddy")
async def break_up(x_device_id: str = Header(...)):
    await execute_db("DELETE FROM buddies WHERE user_id = ?", (x_device_id,))
    return {"success": True, "message": "已解除搭档关系"}

# === STATS ENDPOINT ===

@app.get("/api/stats")
async def get_stats(x_device_id: str = Header(...)):
    now = datetime.now()
    month_start = (now.replace(day=1, hour=0, minute=0, second=0)).isoformat()
    
    total = await query_one("SELECT COUNT(*) as c FROM incidents WHERE user_id = ?", (x_device_id,))
    monthly = await query_one("SELECT COUNT(*) as c FROM incidents WHERE user_id = ? AND date >= ?", (x_device_id, month_start))
    escaped = await query_one("SELECT COUNT(*) as c FROM incidents WHERE user_id = ? AND escaped = 1", (x_device_id,))
    caught = await query_one("SELECT COUNT(*) as c FROM incidents WHERE user_id = ? AND escaped = 0", (x_device_id,))
    days = await query_db("SELECT DISTINCT DATE(date) as day FROM incidents WHERE user_id = ? ORDER BY day DESC", (x_device_id,))
    
    return {
        "total_incidents": total['c'],
        "monthly_incidents": monthly['c'],
        "escaped_count": escaped['c'],
        "caught_count": caught['c'],
        "active_days": len(days),
        "escape_rate": round(escaped['c'] / total['c'] * 100, 1) if total['c'] > 0 else 0
    }

# === DAILY QUOTE ENDPOINT ===

@app.get("/api/daily-quote")
async def get_daily_quote():
    quote = random.choice(DAILY_QUOTES)
    return quote

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)
