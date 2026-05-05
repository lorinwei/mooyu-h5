import os, json, uuid, random
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response
from jose import jwt
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False

SECRET_KEY = "mooyu_serverless_2024"
ALGORITHM = "HS256"

def get_conn():
    return psycopg2.connect(
        "postgresql://neondb_owner:npg_VpfC0AJq1vPR@ep-orange-voice-ao133r0o.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
        sslmode="require",
        cursor_factory=RealDictCursor,
        connect_timeout=10
    )

def query_db(sql, params=()):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(sql, params)
    try:
        rows = cur.fetchall()
        return [dict(r) for r in rows]
    except:
        return []
    finally:
        conn.close()

def query_one(sql, params=()):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(sql, params)
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def execute_db(sql, params=()):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(sql, params)
    conn.commit()
    conn.close()

def json_resp(data, status=200):
    return Response(json.dumps(data, ensure_ascii=False, default=str), status=status, mimetype="application/json")

def require_device_id():
    did = request.headers.get("X-Device-Id")
    if not did:
        return json_resp({"error": "缺少 X-Device-Id header"}, 401)
    return None

QUOTES = [
    {"text": "摸鱼一时爽，一直摸鱼一直爽", "author": "职场前辈"},
    {"text": "上班的目的就是不上班", "author": "FIRE运动"},
    {"text": "摸鱼是给老板最大的尊重", "author": "摸鱼达人"},
    {"text": "今天能完成的工作绝不拖到明天", "author": "摆烂王"},
    {"text": "效率是关键，所以要速战速决", "author": "时间管理大师"},
    {"text": "打工是为了更好的摸鱼", "author": "职场哲学家"},
    {"text": "能躺着绝不坐着，能摸鱼绝不含糊", "author": "咸鱼本鱼"},
    {"text": "工作只是生活的调味剂", "author": "佛系青年"},
    {"text": "世界上最幸福的事，是周五下午没人找你", "author": "摸鱼宝"},
    {"text": "愿你今天的会议都是取消的", "author": "反内卷联盟"},
]

ACHS = {
    "first_incident":    ("初出茅庐",    "🌟", "记录你的第一次摸鱼事件"),
    "ten_incidents":     ("摸鱼老手",    "🐟", "累计记录10次摸鱼事件"),
    "fifty_incidents":   ("摸鱼大师",    "🐠", "累计记录50次摸鱼事件"),
    "hundred_incidents": ("摸鱼传奇",    "🦈", "累计记录100次摸鱼事件"),
    "streak_7":          ("一周不倒",    "🔥", "连续7天记录摸鱼"),
    "streak_30":         ("月度坚守",    "💎", "连续30天记录摸鱼"),
    "overtime_king":     ("加班之王",    "👑", "记录10次加班摸鱼"),
    "meeting_survivor":  ("会议幸存者",  "🏆", "成功从无聊会议中摸鱼10次"),
    "all_types":          ("全能选手",    "🎯", "解锁所有摸鱼类型"),
    "buddy_found":       ("找到搭档",    "🤝", "匹配到一个摸鱼搭档"),
    "buddy_cover":       ("互相掩护",    "🛡️", "成功为搭档打掩护"),
    "perfect_week":      ("完美摸鱼周",  "⭐", "一周每天都有摸鱼记录"),
}

@app.route("/")
def root():
    return json_resp({"msg": "摸鱼宝 API 运转中", "version": "1.0"})

@app.route("/api/health")
def health():
    return json_resp({"status": "ok", "ts": datetime.now().isoformat()})

@app.route("/api/daily-quote")
def daily_quote():
    return json_resp(random.choice(QUOTES))

@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json() or {}
    did = data.get("device_id")
    if not did:
        return json_resp({"error": "缺少 device_id"}, 400)
    profile = data.get("profile", {})
    existing = query_one("SELECT * FROM users WHERE id = %s", (did,))
    now = datetime.now().isoformat()
    if existing:
        execute_db("UPDATE users SET last_visit = %s WHERE id = %s", (now, did))
        return json_resp({"user": existing})
    execute_db("INSERT INTO users (id, created_at, profile, last_visit) VALUES (%s,%s,%s,%s)", (did, now, json.dumps(profile), now))
    u = query_one("SELECT * FROM users WHERE id = %s", (did,))
    token = jwt.encode({"sub": did, "exp": datetime.utcnow() + timedelta(days=30)}, SECRET_KEY, algorithm=ALGORITHM)
    return json_resp({"user": u, "token": token})

@app.route("/api/users/profile", methods=["GET"])
def get_profile():
    err = require_device_id()
    if err: return err
    u = query_one("SELECT profile FROM users WHERE id = %s", (request.headers["X-Device-Id"],))
    if not u: return json_resp({"error": "用户不存在"}, 404)
    p = u.get("profile", "{}")
    return json_resp(json.loads(p) if isinstance(p, str) else p)

@app.route("/api/users/profile", methods=["PUT"])
def update_profile():
    err = require_device_id()
    if err: return err
    did = request.headers["X-Device-Id"]
    updates = request.get_json() or {}
    u = query_one("SELECT profile FROM users WHERE id = %s", (did,))
    if not u: return json_resp({"error": "用户不存在"}, 404)
    cur = json.loads(u.get("profile") or "{}") if isinstance(u.get("profile"), str) else (u.get("profile") or {})
    cur.update(updates)
    execute_db("UPDATE users SET profile = %s WHERE id = %s", (json.dumps(cur), did))
    return json_resp(cur)

@app.route("/api/incidents", methods=["GET"])
def get_incidents():
    err = require_device_id()
    if err: return err
    did = request.headers["X-Device-Id"]
    page = int(request.args.get("page", 1))
    limit = min(int(request.args.get("limit", 20)), 100)
    itype = request.args.get("type")
    offset = (page - 1) * limit
    if itype:
        items = query_db("SELECT * FROM incidents WHERE user_id=%s AND type=%s ORDER BY date DESC LIMIT %s OFFSET %s", (did, itype, limit, offset))
        tot = query_one("SELECT COUNT(*) c FROM incidents WHERE user_id=%s AND type=%s", (did, itype))
    else:
        items = query_db("SELECT * FROM incidents WHERE user_id=%s ORDER BY date DESC LIMIT %s OFFSET %s", (did, limit, offset))
        tot = query_one("SELECT COUNT(*) c FROM incidents WHERE user_id=%s", (did,))
    for i in items:
        if hasattr(i.get("date"), "isoformat"):
            i["date"] = i["date"].isoformat()
    return json_resp({"items": items, "total": tot["c"] if tot else 0, "page": page, "limit": limit})

@app.route("/api/incidents", methods=["POST"])
def create_incident():
    err = require_device_id()
    if err: return err
    did = request.headers["X-Device-Id"]
    data = request.get_json() or {}
    now = datetime.now().isoformat()
    iid = str(uuid.uuid4())
    execute_db("INSERT INTO incidents (id, user_id, type, description, date, escaped) VALUES (%s,%s,%s,%s,%s,%s)",
               (iid, did, data.get("type", "other"), data.get("description", ""), now, data.get("escaped", 1)))
    row = query_one("SELECT * FROM incidents WHERE id=%s", (iid,))
    if row and hasattr(row.get("date"), "isoformat"):
        row["date"] = row["date"].isoformat()
    return json_resp(row or {})

@app.route("/api/achievements", methods=["GET"])
def achievements():
    err = require_device_id()
    if err: return err
    did = request.headers["X-Device-Id"]
    unlocked = {r["achievement_id"]: r["unlocked_at"] for r in query_db("SELECT * FROM achievements WHERE user_id=%s", (did,))}
    return json_resp([{"id": k, "name": v[0], "icon": v[1], "desc": v[2],
                      "unlocked": k in unlocked,
                      "unlocked_at": v[3] if len(v) > 3 else unlocked.get(k)}
                     for k, v in ACHS.items()])

@app.route("/api/achievements/check", methods=["POST"])
def check_achievements():
    err = require_device_id()
    if err: return err
    did = request.headers["X-Device-Id"]
    def cnt(sql, p): r = query_one(sql, p); return r["c"] if r else 0
    ic = cnt("SELECT COUNT(*) c FROM incidents WHERE user_id=%s", (did,))
    oc = cnt("SELECT COUNT(*) c FROM incidents WHERE user_id=%s AND type='overtime'", (did,))
    mc = cnt("SELECT COUNT(*) c FROM incidents WHERE user_id=%s AND type='meeting'", (did,))
    buddy = query_one("SELECT * FROM buddies WHERE user_id=%s", (did,))
    typs = query_db("SELECT DISTINCT type FROM incidents WHERE user_id=%s", (did,))
    checks = {
        "first_incident": ic >= 1, "ten_incidents": ic >= 10, "fifty_incidents": ic >= 50,
        "hundred_incidents": ic >= 100, "overtime_king": oc >= 10, "meeting_survivor": mc >= 10,
        "all_types": len(typs) >= 7, "buddy_found": buddy is not None
    }
    newly = []
    for aid, cond in checks.items():
        if cond and not query_one("SELECT * FROM achievements WHERE user_id=%s AND achievement_id=%s", (did, aid)):
            execute_db("INSERT INTO achievements (id, user_id, achievement_id, unlocked_at) VALUES (%s,%s,%s,%s)",
                       (str(uuid.uuid4()), did, aid, datetime.now().isoformat()))
            newly.append(aid)
    return json_resp({"newly_unlocked": newly})

@app.route("/api/buddy", methods=["GET"])
def get_buddy():
    err = require_device_id()
    if err: return err
    did = request.headers["X-Device-Id"]
    b = query_one("SELECT * FROM buddies WHERE user_id=%s", (did,))
    if b and b.get("partner_profile"):
        b["partner_profile"] = json.loads(b["partner_profile"]) if isinstance(b["partner_profile"], str) else b["partner_profile"]
    return json_resp(b or {})

@app.route("/api/buddy/match", methods=["POST"])
def match_buddy():
    err = require_device_id()
    if err: return err
    did = request.headers["X-Device-Id"]
    prefs = request.get_json() or {}
    existing = query_one("SELECT * FROM buddies WHERE user_id=%s", (did,))
    if existing:
        p = existing.get("partner_profile", "{}")
        existing["partner_profile"] = json.loads(p) if isinstance(p, str) else p
        return json_resp(existing)
    now = datetime.now().isoformat()
    profiles = [
        {"name": "摸鱼小明", "industry": "互联网", "level": "P6", "style": "低调型"},
        {"name": "摸鱼小红", "industry": "金融", "level": "Senior", "style": "活跃型"},
        {"name": "摸鱼阿强", "industry": "科技", "level": "Manager", "style": "稳健型"},
    ]
    p = random.choice(profiles)
    bid = str(uuid.uuid4())
    execute_db("INSERT INTO buddies (id, user_id, partner_id, partner_profile, match_score, matched_at, expires_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
               (bid, did, f"mock_{bid}", json.dumps(p), random.randint(70, 98), now, (datetime.now() + timedelta(days=7)).isoformat()))
    b = query_one("SELECT * FROM buddies WHERE id=%s", (bid,))
    if b and b.get("partner_profile"):
        b["partner_profile"] = json.loads(b["partner_profile"]) if isinstance(b["partner_profile"], str) else b["partner_profile"]
    return json_resp(b)

@app.route("/api/buddy/cover", methods=["POST"])
def buddy_cover():
    err = require_device_id()
    if err: return err
    return json_resp({"success": True, "message": "掩护已发送！🐟"})

@app.route("/api/buddy", methods=["DELETE"])
def delete_buddy():
    err = require_device_id()
    if err: return err
    did = request.headers["X-Device-Id"]
    execute_db("DELETE FROM buddies WHERE user_id=%s", (did,))
    return json_resp({"success": True, "message": "已解除搭档关系"})

@app.route("/api/stats", methods=["GET"])
def stats():
    err = require_device_id()
    if err: return err
    did = request.headers["X-Device-Id"]
    def cnt(sql, p): r = query_one(sql, p); return r["c"] if r else 0
    now = datetime.now()
    m0 = now.replace(day=1, hour=0, minute=0, second=0).isoformat()
    tot = cnt("SELECT COUNT(*) c FROM incidents WHERE user_id=%s", (did,))
    mon = cnt("SELECT COUNT(*) c FROM incidents WHERE user_id=%s AND date>=%s", (did, m0))
    esc = cnt("SELECT COUNT(*) c FROM incidents WHERE user_id=%s AND escaped=1", (did,))
    cat = cnt("SELECT COUNT(*) c FROM incidents WHERE user_id=%s AND escaped=0", (did,))
    days = query_db("SELECT DISTINCT DATE(date) d FROM incidents WHERE user_id=%s", (did,))
    return json_resp({
        "total_incidents": tot, "monthly_incidents": mon, "escaped_count": esc,
        "caught_count": cat, "active_days": len(days),
        "escape_rate": round(esc / tot * 100, 1) if tot else 0
    })

@app.after_request
def after(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response
