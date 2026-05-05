// ─── Static data ─────────────────────────────────────────────────────────────

const QUOTES = [
  { text: "摸鱼一时爽，一直摸鱼一直爽", author: "职场前辈" },
  { text: "上班的目的就是不上班", author: "FIRE运动" },
  { text: "摸鱼是给老板最大的尊重", author: "摸鱼达人" },
  { text: "今天能完成的工作绝不拖到明天", author: "摆烂王" },
  { text: "效率是关键，所以要速战速决", author: "时间管理大师" },
  { text: "打工是为了更好的摸鱼", author: "职场哲学家" },
  { text: "能躺着绝不坐着，能摸鱼绝不含糊", author: "咸鱼本鱼" },
  { text: "工作只是生活的调味剂", author: "佛系青年" },
  { text: "世界上最幸福的事，是周五下午没人找你", author: "摸鱼宝" },
  { text: "愿你今天的会议都是取消的", author: "反内卷联盟" },
];

const ACHS = {
  first_incident:    { name: "初出茅庐",    icon: "🌟", desc: "记录你的第一次摸鱼事件" },
  ten_incidents:     { name: "摸鱼老手",    icon: "🐟", desc: "累计记录10次摸鱼事件" },
  fifty_incidents:   { name: "摸鱼大师",    icon: "🐠", desc: "累计记录50次摸鱼事件" },
  hundred_incidents: { name: "摸鱼传奇",    icon: "🦈", desc: "累计记录100次摸鱼事件" },
  streak_7:           { name: "一周不倒",    icon: "🔥", desc: "连续7天记录摸鱼" },
  streak_30:          { name: "月度坚守",    icon: "💎", desc: "连续30天记录摸鱼" },
  overtime_king:      { name: "加班之王",    icon: "👑", desc: "记录10次加班摸鱼" },
  meeting_survivor:   { name: "会议幸存者",  icon: "🏆", desc: "成功从无聊会议中摸鱼10次" },
  all_types:           { name: "全能选手",    icon: "🎯", desc: "解锁所有摸鱼类型" },
  buddy_found:        { name: "找到搭档",    icon: "🤝", desc: "匹配到一个摸鱼搭档" },
  buddy_cover:        { name: "互相掩护",    icon: "🛡️", desc: "成功为搭档打掩护" },
  perfect_week:       { name: "完美摸鱼周",  icon: "⭐", desc: "一周每天都有摸鱼记录" },
};

const BUDDY_PROFILES = [
  { name: "摸鱼小明", industry: "互联网", level: "P6", style: "低调型" },
  { name: "摸鱼小红", industry: "金融", level: "Senior", style: "活跃型" },
  { name: "摸鱼阿强", industry: "科技", level: "Manager", style: "稳健型" },
  { name: "摸鱼小李", industry: "咨询", level: "Associate", style: "创意型" },
];

const SECRET = "mooyu_cf_worker_secret_2024";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 0), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

function getDid(request) {
  return request.headers.get("X-Device-Id") || "";
}

async function kvGet(kv, key) {
  return await kv.get(key);
}

async function kvPut(kv, key, value) {
  await kv.put(key, value);
}

async function kvDel(kv, key) {
  await kv.delete(key);
}

async function getUser(kv, did) {
  const raw = await kvGet(kv, `user:${did}`);
  return raw ? JSON.parse(raw) : null;
}

async function saveUser(kv, did, data) {
  await kvPut(kv, `user:${did}`, JSON.stringify(data));
}

async function listIncidents(kv, did, limit = 20, offset = 0, itype = null) {
  const key = `incidents:${did}${itype ? ":" + itype : ""}`;
  const raw = await kvGet(kv, key);
  const allIds = raw ? JSON.parse(raw) : [];
  const total = allIds.length;
  const items = [];
  for (const iid of allIds.slice(offset, offset + limit)) {
    const r = await kvGet(kv, `incident:${did}:${iid}`);
    if (r) items.push(JSON.parse(r));
  }
  return { items, total };
}

async function addIncident(kv, did, incident) {
  const { id: iid, type } = incident;
  for (const k of [`incidents:${did}`, `incidents:${did}:${type}`]) {
    const raw = await kvGet(kv, k);
    const ids = raw ? JSON.parse(raw) : [];
    if (!ids.includes(iid)) ids.unshift(iid);
    await kvPut(kv, k, JSON.stringify(ids));
  }
  await kvPut(kv, `incident:${did}:${iid}`, JSON.stringify(incident));
}

async function countIncidents(kv, did, options = {}) {
  const { type, escaped } = options;
  const key = `incidents:${did}${type ? ":" + type : ""}`;
  const raw = await kvGet(kv, key);
  const ids = raw ? JSON.parse(raw) : [];
  if (escaped === undefined) return ids.length;
  let count = 0;
  for (const iid of ids) {
    const r = await kvGet(kv, `incident:${did}:${iid}`);
    if (r && JSON.parse(r).escaped === escaped) count++;
  }
  return count;
}

function makeToken(uid) {
  const payload = `${uid}|${Math.floor(Date.now() / 1000)}`;
  const sig = btoa(payload + SECRET).slice(0, 16);
  return btoa(`${payload}|${sig}`);
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleRequest(request, kv) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  const method = request.method;
  const did = getDid(request);

  if (path === "" || path === "/") return json({ msg: "摸鱼宝 API 运转中", version: "1.0" });
  if (path === "/api/health") return json({ status: "ok", ts: new Date().toISOString() });
  if (path === "/api/daily-quote") return json(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  if (path === "/api/users" && method === "POST") {
    const data = await request.json().catch(() => ({}));
    const deviceId = data.device_id || did;
    if (!deviceId) return json({ error: "缺少 device_id" }, 400);
    const profile = data.profile || {};
    const existing = await getUser(kv, deviceId);
    const now = new Date().toISOString();
    if (existing) {
      existing.last_visit = now;
      await saveUser(kv, deviceId, existing);
      return json({ user: existing });
    }
    const newUser = { id: deviceId, profile, created_at: now, last_visit: now };
    await saveUser(kv, deviceId, newUser);
    return json({ user: newUser, token: makeToken(deviceId) });
  }

  if (path === "/api/users/profile" && method === "GET") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    const u = await getUser(kv, did);
    if (!u) return json({ error: "用户不存在" }, 404);
    return json(u.profile || {});
  }

  if (path === "/api/users/profile" && method === "PUT") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    const u = await getUser(kv, did);
    if (!u) return json({ error: "用户不存在" }, 404);
    const updates = await request.json().catch(() => ({}));
    u.profile = { ...(u.profile || {}), ...updates };
    await saveUser(kv, did, u);
    return json(u.profile);
  }

  if (path === "/api/incidents" && method === "GET") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const itype = url.searchParams.get("type") || null;
    const offset = (page - 1) * limit;
    const { items, total } = await listIncidents(kv, did, limit, offset, itype);
    return json({ items, total, page, limit });
  }

  if (path === "/api/incidents" && method === "POST") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    const data = await request.json().catch(() => ({}));
    const now = new Date().toISOString();
    const iid = crypto.randomUUID();
    const incident = {
      id: iid, user_id: did,
      type: data.type || "other",
      description: data.description || "",
      date: now, escaped: data.escaped ?? 1,
    };
    await addIncident(kv, did, incident);
    return json(incident);
  }

  if (path === "/api/achievements" && method === "GET") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    const raw = await kvGet(kv, `achs:${did}`);
    const unlocked = raw ? JSON.parse(raw) : {};
    return json(Object.entries(ACHS).map(([id, v]) => ({
      id, name: v.name, icon: v.icon, desc: v.desc,
      unlocked: id in unlocked, unlocked_at: unlocked[id],
    })));
  }

  if (path === "/api/achievements/check" && method === "POST") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    const total = await countIncidents(kv, did);
    const overtime = await countIncidents(kv, did, { type: "overtime" });
    const meeting = await countIncidents(kv, did, { type: "meeting" });
    const buddyRaw = await kvGet(kv, `buddy:${did}`);
    const buddy = buddyRaw ? JSON.parse(buddyRaw) : null;
    const typesKeys = ["meeting","overtime","break","other","chat","social"];
    let typesCount = 0;
    for (const t of typesKeys) {
      const r = await kvGet(kv, `incidents:${did}:${t}`);
      if (r && JSON.parse(r).length > 0) typesCount++;
    }
    const checks = {
      first_incident: total >= 1,
      ten_incidents: total >= 10,
      fifty_incidents: total >= 50,
      hundred_incidents: total >= 100,
      overtime_king: overtime >= 10,
      meeting_survivor: meeting >= 10,
      all_types: typesCount >= 5,
      buddy_found: !!buddy,
    };
    const raw = await kvGet(kv, `achs:${did}`);
    const unlocked = raw ? JSON.parse(raw) : {};
    const now = new Date().toISOString();
    const newly = [];
    for (const [aid, cond] of Object.entries(checks)) {
      if (cond && !(aid in unlocked)) {
        unlocked[aid] = now;
        newly.push(aid);
      }
    }
    if (newly.length) await kvPut(kv, `achs:${did}`, JSON.stringify(unlocked));
    return json({ newly_unlocked: newly });
  }

  if (path === "/api/buddy" && method === "GET") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    const raw = await kvGet(kv, `buddy:${did}`);
    return json(raw ? JSON.parse(raw) : {});
  }

  if (path === "/api/buddy/match" && method === "POST") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    const existing = await kvGet(kv, `buddy:${did}`);
    if (existing) return json(JSON.parse(existing));
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const buddy = {
      id: crypto.randomUUID(), user_id: did,
      partner_id: `mock_${Math.random().toString(36).slice(2, 10)}`,
      partner_profile: BUDDY_PROFILES[Math.floor(Math.random() * BUDDY_PROFILES.length)],
      match_score: 70 + Math.floor(Math.random() * 28),
      matched_at: now, expires_at: expires,
    };
    await kvPut(kv, `buddy:${did}`, JSON.stringify(buddy));
    return json(buddy);
  }

  if (path === "/api/buddy/cover" && method === "POST") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    return json({ success: true, message: "掩护已发送！🐟" });
  }

  if (path === "/api/buddy" && method === "DELETE") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    await kvDel(kv, `buddy:${did}`);
    return json({ success: true, message: "已解除搭档关系" });
  }

  if (path === "/api/stats" && method === "GET") {
    if (!did) return json({ error: "缺少 X-Device-Id header" }, 401);
    const total = await countIncidents(kv, did);
    const escaped = await countIncidents(kv, did, { escaped: 1 });
    const caught = await countIncidents(kv, did, { escaped: 0 });
    const idsRaw = await kvGet(kv, `incidents:${did}`);
    const ids = idsRaw ? JSON.parse(idsRaw) : [];
    const days = new Set();
    for (const iid of ids) {
      const r = await kvGet(kv, `incident:${did}:${iid}`);
      if (r) {
        const d = JSON.parse(r).date;
        if (d) days.add(d.slice(0, 10));
      }
    }
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    let monthly = 0;
    for (const iid of ids) {
      const r = await kvGet(kv, `incident:${did}:${iid}`);
      if (r && JSON.parse(r).date >= monthStart.toISOString()) monthly++;
    }
    return json({
      total_incidents: total, monthly_incidents: monthly,
      escaped_count: escaped, caught_count: caught,
      active_days: days.size,
      escape_rate: total ? Math.round(escaped / total * 100 * 10) / 10 : 0,
    });
  }

  if (method === "OPTIONS") return json({});

  return json({ error: "API路径不存在" }, 404);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env.MOYU_KV);
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  },
};
