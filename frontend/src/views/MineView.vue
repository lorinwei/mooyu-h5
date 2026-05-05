<template>
  <div class="mine-view">
    <!-- 用户卡片 -->
    <div class="user-card card animate-slide-up">
      <div class="user-avatar">{{ avatarEmoji }}</div>
      <div class="user-info">
        <h3>摸鱼修行者</h3>
        <div class="user-tags">
          <span class="user-tag" v-for="tag in userTags" :key="tag">{{ tag }}</span>
          <span v-if="!store.isProfileComplete" class="user-tag tag-empty">未完成画像</span>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" @click="goToBuddy">完善画像</button>
    </div>

    <!-- 本月战报 -->
    <div class="stats-section animate-slide-up" style="animation-delay:80ms">
      <h3 class="section-title">本月摸鱼战报</h3>
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-icon">🛡️</div>
          <div class="stat-value">{{ store.monthIncidents.length }}</div>
          <div class="stat-label">劫后余生</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon">📅</div>
          <div class="stat-value">{{ activeDaysThisMonth }}</div>
          <div class="stat-label">活跃天数</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">{{ store.unlockedAchievements.length }}</div>
          <div class="stat-label">解锁成就</div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">{{ currentStreak }}</div>
          <div class="stat-label">连续天数</div>
        </div>
      </div>
    </div>

    <!-- 成就墙 -->
    <div class="achievements-section animate-slide-up" style="animation-delay:160ms">
      <h3 class="section-title">成就墙</h3>
      <div class="achievements-grid">
        <AchievementBadge
          v-for="a in allAchievements"
          :key="a.id"
          :achievement="a"
          :unlocked="isUnlocked(a.id)"
          :progress="getProgress(a.id)"
        />
      </div>
    </div>

    <!-- 最近记录 -->
    <div class="history-section animate-slide-up" style="animation-delay:240ms">
      <h3 class="section-title">最近的劫</h3>
      <div v-if="recentIncidents.length === 0" class="empty-history card">
        <p>还没有记录过差点事件</p>
        <button class="btn btn-primary" @click="goToIncident">去记录一个</button>
      </div>
      <div v-else class="history-list">
        <div v-for="incident in recentIncidents" :key="incident.id" class="history-item card">
          <div class="history-icon">{{ getTypeIcon(incident.type) }}</div>
          <div class="history-content">
            <div class="history-type">{{ getTypeName(incident.type) }}</div>
            <div class="history-desc">{{ incident.description || '成功躲过这一劫' }}</div>
            <div class="history-date">{{ formatDate(incident.date) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="settings-section animate-slide-up" style="animation-delay:320ms">
      <h3 class="section-title">数据管理</h3>
      <div class="settings-list card">
        <div class="settings-item" @click="handleReset">
          <span class="settings-icon">🗑️</span>
          <span>清空所有数据</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMooyuStore } from '../stores/mooyu';
import AchievementBadge from '../components/AchievementBadge.vue';
import { ACHIEVEMENTS, EVENT_TYPES } from '../api/mock';

const router = useRouter();
const store = useMooyuStore();
const allAchievements = ACHIEVEMENTS;

const avatarEmoji = computed(() => {
  if (store.license.isPremium) return '👑';
  if (store.unlockedAchievements.length >= 5) return '🦸';
  if (store.unlockedAchievements.length >= 3) return '🐟';
  return '🧑‍💼';
});

const userTags = computed(() => {
  if (!store.isProfileComplete) return [];
  const { industry, level, overtime } = store.profile;
  return [industry, level, overtime].filter(Boolean);
});

const activeDaysThisMonth = computed(() => {
  const monthStart = new Date().toISOString().slice(0, 7) + '-01';
  return store.activeDays.filter(d => d >= monthStart).length;
});

const currentStreak = computed(() => {
  if (!store.activeDays.length) return 0;
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...store.activeDays].sort().reverse();
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (sorted[i] === expected.toISOString().split('T')[0]) streak++;
    else break;
  }
  return streak;
});

const recentIncidents = computed(() => store.incidents.slice(0, 5));

function isUnlocked(id) { return !!store.achievements[id]?.unlocked; }
function getProgress(id) { return store.achievementProgress[id] || 0; }
function getTypeIcon(id) { return EVENT_TYPES.find(t => t.id === id)?.icon || '🎯'; }
function getTypeName(id) { return EVENT_TYPES.find(t => t.id === id)?.label || id; }

function formatDate(str) {
  const d = new Date(str), now = new Date();
  const days = Math.floor((now - d) / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function goToBuddy() { router.push('/buddy'); }
function goToIncident() { router.push('/incident'); }
function handleReset() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    store.resetData();
    alert('数据已清空');
  }
}
</script>

<style scoped>
.mine-view { padding-bottom: var(--spacing-xxl); }

.user-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
  box-shadow: 0 0 20px var(--primary-glow);
}

.user-info { flex: 1; min-width: 0; }
.user-info h3 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }

.user-tags { display: flex; flex-wrap: wrap; gap: 4px; }

.user-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-surface);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
}

.user-tag.tag-empty {
  background: rgba(239, 71, 111, 0.1);
  color: var(--danger);
}

.btn-sm {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 13px;
  min-height: 36px;
  min-width: auto;
  white-space: nowrap;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim);
  margin-bottom: var(--spacing-md);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.stats-section { margin-top: var(--spacing-lg); }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.stat-card {
  text-align: center;
  padding: var(--spacing-md);
}

.stat-icon { font-size: 22px; margin-bottom: var(--spacing-xs); }

.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 2px;
}

.achievements-section { margin-top: var(--spacing-lg); }

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.history-section { margin-top: var(--spacing-lg); }

.empty-history {
  text-align: center;
  padding: var(--spacing-xl);
}

.empty-history p { color: var(--text-secondary); margin-bottom: var(--spacing-md); }

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.history-icon { font-size: 26px; flex-shrink: 0; }
.history-content { flex: 1; min-width: 0; }

.history-type {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.history-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.history-date { font-size: 11px; color: var(--text-dim); }

.settings-section { margin-top: var(--spacing-lg); }

.settings-list { padding: 0; overflow: hidden; }

.settings-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.settings-item:active { background: rgba(239, 71, 111, 0.05); }
.settings-icon { font-size: 20px; }
.settings-item span:last-child { font-size: 15px; color: var(--danger); }
</style>
