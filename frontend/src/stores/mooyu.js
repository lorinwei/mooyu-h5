import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import {
  EVENT_TYPES,
  getRandomQuote,
  getDaysUntilMonthEnd
} from '../api/mock';
import * as api from '../api/index';

const STORAGE_KEY = 'mooyubao_data';

// ========== 统一成就体系（与后端对齐） ==========
export const ACHIEVEMENTS = [
  { id: 'first_incident',    name: '初出茅庐',    icon: '🌟', description: '记录你的第一次摸鱼事件' },
  { id: 'ten_incidents',     name: '摸鱼老手',    icon: '🐟', description: '累计记录10次摸鱼事件' },
  { id: 'fifty_incidents',   name: '摸鱼大师',    icon: '🐠', description: '累计记录50次摸鱼事件' },
  { id: 'hundred_incidents', name: '摸鱼传奇',    icon: '🦈', description: '累计记录100次摸鱼事件' },
  { id: 'streak_7',          name: '一周不倒',    icon: '🔥', description: '连续7天记录摸鱼' },
  { id: 'streak_30',         name: '月度坚守',    icon: '💎', description: '连续30天记录摸鱼' },
  { id: 'overtime_king',     name: '加班之王',    icon: '👑', description: '记录10次加班摸鱼' },
  { id: 'meeting_survivor',  name: '会议幸存者',  icon: '🏆', description: '成功从无聊会议中摸鱼10次' },
  { id: 'all_types',          name: '全能选手',    icon: '🎯', description: '解锁所有摸鱼类型' },
  { id: 'buddy_found',       name: '找到搭档',    icon: '🤝', description: '匹配到一个摸鱼搭档' },
  { id: 'buddy_cover',       name: '互相掩护',    icon: '🛡️', description: '成功为搭档打掩护' },
  { id: 'perfect_week',      name: '完美摸鱼周',  icon: '⭐', description: '一周每天都有摸鱼记录' },
];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getResetTime() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) { /* ignore */ }
  return null;
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

export const useMooyuStore = defineStore('mooyu', () => {
  const stored = loadFromStorage();
  const today = getToday();

  const profile = ref(stored?.profile || { industry: '', level: '', overtime: '', style: '', workYears: '' });
  const license = ref(stored?.license || { quota: 30, used: 0, isPremium: false, resetDate: new Date().toISOString(), lastVisit: today });
  const incidents = ref(stored?.incidents || []);
  const buddy = ref(stored?.buddy || { matched: false });
  const achievements = ref(stored?.achievements || {});
  const activeDays = ref(stored?.activeDays || []);
  const dailyQuote = ref(stored?.dailyQuote || '摸鱼一时爽，一直摸鱼一直爽');
  const isApiConnected = ref(false);
  const isLoading = ref(false);

  const isProfileComplete = computed(() =>
    profile.value.industry && profile.value.level &&
    profile.value.overtime && profile.value.style && profile.value.workYears
  );

  const totalEscapes = computed(() => incidents.value.length);

  const todayIncidents = computed(() =>
    incidents.value.filter(inc => inc.date?.startsWith(today))
  );

  const monthIncidents = computed(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return incidents.value.filter(inc => inc.date >= monthStart);
  });

  const remainingQuota = computed(() => {
    if (license.value.lastVisit !== today) return license.value.quota;
    return Math.max(0, license.value.quota - license.value.used);
  });

  const daysUntilMonthEnd = computed(() => getDaysUntilMonthEnd());

  const unlockedAchievements = computed(() => {
    return ACHIEVEMENTS
      .filter(a => achievements.value[a.id]?.unlocked)
      .map(a => ({ ...a, unlockedAt: achievements.value[a.id].unlockedAt }));
  });

  const achievementProgress = computed(() => {
    const progress = {};
    const uniqueTypes = new Set(incidents.value.map(i => i.type));
    const uniqueDays = new Set(activeDays.value).size;
    const overtimeCount = incidents.value.filter(i => i.type === 'overtime').length;
    const meetingCount = incidents.value.filter(i => i.type === 'meeting').length;
    progress.first_incident    = Math.min(100, (totalEscapes.value / 1) * 100);
    progress.ten_incidents     = Math.min(100, (totalEscapes.value / 10) * 100);
    progress.fifty_incidents   = Math.min(100, (totalEscapes.value / 50) * 100);
    progress.hundred_incidents = Math.min(100, (totalEscapes.value / 100) * 100);
    progress.streak_7          = Math.min(100, (uniqueDays / 7) * 100);
    progress.streak_30         = Math.min(100, (uniqueDays / 30) * 100);
    progress.overtime_king     = Math.min(100, (overtimeCount / 10) * 100);
    progress.meeting_survivor  = Math.min(100, (meetingCount / 10) * 100);
    progress.all_types          = Math.min(100, (uniqueTypes.size / 7) * 100);
    progress.buddy_found       = buddy.value.matched ? 100 : 0;
    progress.buddy_cover       = 0;
    progress.perfect_week      = Math.min(100, (uniqueDays / 7) * 100);
    return progress;
  });

  async function initFromApi() {
    isLoading.value = true;
    try {
      let deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('device_id', deviceId);
      }
      const { token } = await api.createOrGetUser(deviceId, profile.value);
      localStorage.setItem('token', token);
      const incData = await api.getIncidents({ limit: 100 });
      if (incData.items?.length > 0) {
        incidents.value = incData.items;
      }
      const achData = await api.getAchievements();
      achData.forEach(a => {
        if (a.unlocked) achievements.value[a.id] = { unlocked: true, unlockedAt: a.unlocked_at };
      });
      const buddyData = await api.getBuddy();
      if (buddyData && buddyData.id) {
        buddy.value = {
          matched: true,
          partner: JSON.parse(buddyData.partner_profile || '{}'),
          matchedDate: buddyData.matched_at,
          expiresDate: buddyData.expires_at,
          matchScore: buddyData.match_score
        };
      }
      const quote = await api.getDailyQuote();
      if (quote.text) dailyQuote.value = quote.text;
      isApiConnected.value = true;
    } catch (err) {
      console.warn('API连接失败，使用本地数据：', err.message);
      isApiConnected.value = false;
    } finally {
      isLoading.value = false;
    }
  }

  function trackActiveDay() {
    const t = getToday();
    if (!activeDays.value.includes(t)) activeDays.value.push(t);
  }

  function updateDailyQuote() {
    if (license.value.lastVisit !== today) {
      license.value.lastVisit = today;
      license.value.used = 0;
      license.value.resetDate = new Date(getResetTime()).toISOString();
      api.getDailyQuote().then(q => {
        if (q.text) dailyQuote.value = q.text;
      }).catch(() => {
        dailyQuote.value = getRandomQuote();
      });
    }
  }

  function useQuota(minutes = 1) {
    if (license.value.lastVisit !== today) updateDailyQuote();
    if (license.value.used < license.value.quota) {
      license.value.used += minutes;
      trackActiveDay();
    }
  }

  async function addIncident(type, description) {
    const incident = {
      id: 'local_' + Date.now(),
      type, description,
      date: new Date().toISOString(),
      escaped: true
    };
    incidents.value.unshift(incident);
    trackActiveDay();
    if (isApiConnected.value) {
      try {
        const created = await api.createIncident(type, description);
        incident.id = created.id;
        incident.date = created.date;
        await api.checkAchievements();
        await reloadAchievements();
      } catch (err) { console.warn('同步失败：', err.message); }
    }
    return incident;
  }

  async function reloadAchievements() {
    if (!isApiConnected.value) return;
    try {
      const achData = await api.getAchievements();
      achData.forEach(a => {
        if (a.unlocked) achievements.value[a.id] = { unlocked: true, unlockedAt: a.unlocked_at };
      });
    } catch (err) { /* ignore */ }
  }

  async function updateProfile(data) {
    profile.value = { ...profile.value, ...data };
    if (isApiConnected.value) {
      try {
        await api.updateProfile(data);
        await api.checkAchievements();
        await reloadAchievements();
      } catch (err) { console.warn('Profile sync failed:', err.message); }
    }
  }

  function setPremium(isPremium) {
    license.value.isPremium = isPremium;
    license.value.quota = isPremium ? 60 : 30;
  }

  async function doMatchBuddy() {
    if (!isApiConnected.value) {
      buddy.value = {
        matched: true,
        partner: {
          industry: profile.value.industry || '互联网',
          level: profile.value.level || 'P6',
          overtime: profile.value.overtime || '经常加班',
          style: profile.value.style || '间歇型',
          matchScore: Math.floor(Math.random() * 15) + 80
        },
        matchedDate: new Date().toISOString(),
        expiresDate: new Date(Date.now() + 7 * 86400000).toISOString()
      };
      return;
    }
    try {
      const data = await api.matchBuddy();
      buddy.value = {
        matched: true,
        partner: JSON.parse(data.partner_profile || '{}'),
        matchedDate: data.matched_at,
        expiresDate: data.expires_at,
        matchScore: data.match_score
      };
      await api.checkAchievements();
      await reloadAchievements();
    } catch (err) {
      console.warn('匹配失败：', err.message);
    }
  }

  async function sendCoverRequest() {
    if (isApiConnected.value) {
      try {
        await api.sendCoverRequest();
        alert('掩护请求已发送！搭子收到信号了 🛡️');
        return;
      } catch (err) { console.warn('掩护请求失败：', err.message); }
    }
    alert('掩护请求已发送！搭子收到信号了 🛡️');
  }

  async function breakUpBuddy() {
    buddy.value = { matched: false };
    if (isApiConnected.value) {
      try { await api.breakUpBuddy(); }
      catch (err) { console.warn('分手失败：', err.message); }
    }
  }

  function getEventType(id) { return EVENT_TYPES.find(e => e.id === id); }
  function getAchievement(id) { return ACHIEVEMENTS.find(a => a.id === id); }

  function resetData() {
    profile.value = { industry: '', level: '', overtime: '', style: '', workYears: '' };
    license.value = { quota: 30, used: 0, isPremium: false, resetDate: new Date().toISOString(), lastVisit: today };
    incidents.value = [];
    buddy.value = { matched: false };
    achievements.value = {};
    activeDays.value = [];
    dailyQuote.value = getRandomQuote();
  }

  watch(
    () => ({
      profile: profile.value,
      license: license.value,
      incidents: incidents.value,
      buddy: buddy.value,
      achievements: achievements.value,
      activeDays: activeDays.value,
      dailyQuote: dailyQuote.value
    }),
    state => saveToStorage(state),
    { deep: true }
  );

  initFromApi();
  updateDailyQuote();
  trackActiveDay();

  return {
    profile, license, incidents, buddy, achievements,
    activeDays, dailyQuote, isApiConnected, isLoading,
    isProfileComplete, totalEscapes, todayIncidents, monthIncidents,
    remainingQuota, daysUntilMonthEnd, unlockedAchievements, achievementProgress,
    useQuota, addIncident, updateProfile, setPremium,
    matchBuddy: doMatchBuddy, sendCoverRequest, breakUpBuddy,
    updateDailyQuote, trackActiveDay, resetData,
    getEventType, getAchievement, initFromApi
  };
});
