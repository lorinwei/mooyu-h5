import axios from 'axios';

const BASE_URL = 'https://mooyu-api.lorinwei.workers.dev/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// 请求拦截：注入 device_id
api.interceptors.request.use(config => {
  const deviceId = localStorage.getItem('device_id') || generateDeviceId();
  config.headers['X-Device-Id'] = deviceId;
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// 响应拦截：token 过期时清理
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

function generateDeviceId() {
  const id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  localStorage.setItem('device_id', id);
  return id;
}

// ========== 用户 API ==========

export async function createOrGetUser(deviceId, profile = {}) {
  const res = await api.post('/users', { device_id: deviceId, profile });
  return res.data; // { user, token }
}

export async function getProfile() {
  const res = await api.get('/users/profile');
  return res.data;
}

export async function updateProfile(data) {
  const res = await api.put('/users/profile', data);
  return res.data;
}

// ========== 劫后余生 API ==========

export async function getIncidents({ page = 1, limit = 50, type = null } = {}) {
  const res = await api.get('/incidents', { params: { page, limit, type } });
  return res.data; // { items, total, page, limit }
}

export async function createIncident(type, description) {
  const res = await api.post('/incidents', { type, description, escaped: 1 });
  return res.data;
}

// ========== 成就 API ==========

export async function getAchievements() {
  const res = await api.get('/achievements');
  return res.data; // array of achievements
}

export async function checkAchievements() {
  const res = await api.post('/achievements/check');
  return res.data; // { newly_unlocked: [] }
}

// ========== 搭子 API ==========

export async function getBuddy() {
  const res = await api.get('/buddy');
  return res.data; // null or buddy object
}

export async function matchBuddy(preferIndustry = null) {
  const res = await api.post('/buddy/match', { prefer_industry: preferIndustry });
  return res.data;
}

export async function sendCoverRequest() {
  const res = await api.post('/buddy/cover');
  return res.data;
}

export async function breakUpBuddy() {
  const res = await api.delete('/buddy');
  return res.data;
}

// ========== 统计 API ==========

export async function getStats() {
  const res = await api.get('/stats');
  return res.data;
}

// ========== 语录 API ==========

export async function getDailyQuote() {
  const res = await api.get('/daily-quote');
  return res.data;
}

// ========== 健康检查 ==========

export async function healthCheck() {
  try {
    await api.get('/health', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export default api;
