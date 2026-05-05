<template>
  <div class="license-card" :class="statusClass">
    <!-- 顶部装饰线 -->
    <div class="card-accent-line"></div>

    <div class="card-header">
      <div class="header-left">
        <span class="license-icon">📜</span>
        <span class="license-title">今日许可证</span>
      </div>
      <div class="header-right">
        <span v-if="store.license.isPremium" class="premium-badge">⭐ 会员</span>
        <span v-if="store.daysUntilMonthEnd <= 3 && store.daysUntilMonthEnd > 0" class="streak-badge">
          🔥 本月还差{{ store.daysUntilMonthEnd }}天满勤
        </span>
      </div>
    </div>

    <div class="time-display">
      <div class="time-item">
        <span class="time-value">{{ store.license.quota }}</span>
        <span class="time-label">允许</span>
      </div>
      <div class="time-divider">/</div>
      <div class="time-item used">
        <span class="time-value">{{ store.license.used }}</span>
        <span class="time-label">已用</span>
      </div>
      <div class="time-divider">/</div>
      <div class="time-item remaining">
        <span class="time-value">{{ store.remainingQuota }}</span>
        <span class="time-label">剩余</span>
      </div>
    </div>

    <div class="progress-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercent + '%' }"
          :class="progressClass"
        ></div>
      </div>
      <span class="progress-text">{{ progressPercent }}%</span>
    </div>

    <div v-if="isEmpty" class="empty-message">
      <span class="empty-icon">😴</span>
      <span>今天的额度用完啦，明天再来摸吧~</span>
    </div>

    <div v-else class="hint-text">
      今日已记录 <strong>{{ store.todayIncidents.length }}</strong> 个差点事件
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useMooyuStore } from '../stores/mooyu';

const store = useMooyuStore();

const progressPercent = computed(() => {
  if (store.license.quota === 0) return 100;
  return Math.round((store.license.used / store.license.quota) * 100);
});

const isEmpty = computed(() => store.remainingQuota <= 0);

const statusClass = computed(() => {
  if (isEmpty.value) return 'status-empty';
  if (store.remainingQuota <= 5) return 'status-warning';
  return 'status-normal';
});

const progressClass = computed(() => {
  if (isEmpty.value) return 'progress-empty';
  if (store.remainingQuota <= 5) return 'progress-warning';
  return 'progress-normal';
});
</script>

<style scoped>
.license-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-normal);
}

.license-card.status-normal {
  border-color: rgba(255, 107, 53, 0.35);
  box-shadow: var(--shadow-card), 0 0 30px rgba(255, 107, 53, 0.1);
}

.license-card.status-warning {
  border-color: rgba(255, 209, 102, 0.4);
  box-shadow: var(--shadow-card), 0 0 25px rgba(255, 209, 102, 0.08);
}

.license-card.status-empty {
  border-color: var(--border);
  opacity: 0.7;
}

.card-accent-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
  opacity: 0.8;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.license-icon {
  font-size: 22px;
  filter: drop-shadow(0 0 6px rgba(255, 107, 53, 0.3));
}

.license-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.premium-badge {
  background: linear-gradient(135deg, var(--accent), #ffb347);
  color: #1a1a2e;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.streak-badge {
  font-size: 11px;
  color: var(--accent);
  background: rgba(255, 209, 102, 0.1);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.time-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.time-item {
  text-align: center;
  flex: 1;
}

.time-value {
  display: block;
  font-size: 30px;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.time-item.used .time-value {
  color: var(--text-secondary);
}

.time-item.remaining .time-value {
  color: var(--success);
}

.time-label {
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 1px;
}

.time-divider {
  font-size: 22px;
  color: var(--border-light);
  padding-bottom: 18px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-surface);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 800ms cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.progress-fill.progress-normal {
  background: var(--gradient-primary);
}

.progress-fill.progress-warning {
  background: linear-gradient(90deg, var(--accent), #ffb347);
}

.progress-fill.progress-empty {
  background: var(--text-dim);
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.empty-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: 13px;
  padding: var(--spacing-md);
  background: var(--bg-surface);
  border-radius: var(--radius-md);
}

.empty-icon { font-size: 18px; }

.hint-text {
  text-align: center;
  color: var(--text-dim);
  font-size: 12px;
}

.hint-text strong {
  color: var(--primary);
  font-weight: 700;
}
</style>
