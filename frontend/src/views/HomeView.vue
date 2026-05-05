<template>
  <div class="home-view">
    <!-- 今日许可证 -->
    <LicenseCard class="animate-slide-up" />

    <!-- 每日语录 -->
    <div class="daily-quote card animate-slide-up" style="animation-delay:80ms">
      <p class="quote-text">{{ store.dailyQuote }}</p>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions animate-slide-up" style="animation-delay:160ms">
      <h3 class="section-title">今日任务</h3>
      <div class="action-grid">
        <div class="action-card" @click="goToRecord">
          <div class="action-icon">📝</div>
          <span class="action-label">记录差点</span>
          <span class="action-hint" v-if="store.todayIncidents.length > 0">
            今日已记 {{ store.todayIncidents.length }} 条
          </span>
          <span class="action-hint" v-else>去记录一个</span>
        </div>

        <div class="action-card" @click="goToBuddy">
          <div class="action-icon">🤝</div>
          <span class="action-label">找搭子</span>
          <span class="action-hint" v-if="!store.buddy.matched">开启匹配</span>
          <span class="action-hint" v-else>搭子在线</span>
        </div>

        <div class="action-card" @click="goToMine">
          <div class="action-icon">🏆</div>
          <span class="action-label">成就</span>
          <span class="action-hint">
            {{ store.unlockedAchievements.length }}/{{ totalAchievements }}
          </span>
        </div>

        <div class="action-card" @click="togglePremium">
          <div class="action-icon" :style="{ filter: store.license.isPremium ? 'drop-shadow(0 0 8px #FFD166)' : 'none' }">
            {{ store.license.isPremium ? '👑' : '☆' }}
          </div>
          <span class="action-label">{{ store.license.isPremium ? '会员已开' : '开通会员' }}</span>
          <span class="action-hint">{{ store.license.isPremium ? '双倍配额' : '60分钟/天' }}</span>
        </div>
      </div>
    </div>

    <!-- 本月战报 -->
    <div class="today-stats card animate-slide-up" style="animation-delay:240ms">
      <h3 class="section-title">本月摸鱼战报</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ store.monthIncidents.length }}</span>
          <span class="stat-label">劫后余生</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ uniqueDaysThisMonth }}</span>
          <span class="stat-label">活跃天数</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ store.unlockedAchievements.length }}</span>
          <span class="stat-label">解锁成就</span>
        </div>
      </div>
    </div>

    <!-- 差一点提示 -->
    <div v-if="store.daysUntilMonthEnd <= 3 && store.daysUntilMonthEnd > 0"
         class="streak-tip card animate-slide-up" style="animation-delay:320ms">
      <span class="tip-icon">🔥</span>
      <span>本月还差 <strong>{{ store.daysUntilMonthEnd }} 天</strong> 满勤，继续加油！</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMooyuStore } from '../stores/mooyu';
import LicenseCard from '../components/LicenseCard.vue';
import { ACHIEVEMENTS } from '../api/mock';

const router = useRouter();
const store = useMooyuStore();
const totalAchievements = ACHIEVEMENTS.length;

const uniqueDaysThisMonth = computed(() => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  return store.activeDays.filter(day => day >= monthStart).length;
});

function goToRecord() { router.push('/incident'); }
function goToBuddy() { router.push('/buddy'); }
function goToMine() { router.push('/mine'); }
function togglePremium() { store.setPremium(!store.license.isPremium); }
</script>

<style scoped>
.home-view {
  padding-bottom: var(--spacing-xl);
}

.daily-quote {
  margin-top: var(--spacing-md);
  background: var(--gradient-primary);
  border: none;
  padding: var(--spacing-md) var(--spacing-lg);
}

.quote-text {
  color: white;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
  margin: 0;
  font-weight: 500;
  text-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  letter-spacing: 1px;
}

.quick-actions {
  margin-top: var(--spacing-lg);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.action-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: all var(--transition-fast);
}

.action-card:active {
  transform: scale(0.96);
  border-color: var(--primary);
  box-shadow: 0 0 20px var(--primary-glow);
}

.action-icon {
  font-size: 32px;
  margin-bottom: var(--spacing-sm);
  display: block;
}

.action-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.action-hint {
  font-size: 12px;
  color: var(--text-dim);
}

.today-stats {
  margin-top: var(--spacing-lg);
}

.stats-grid {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 1px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
}

.streak-tip {
  margin-top: var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background: rgba(255, 209, 102, 0.06);
  border: 1px solid rgba(255, 209, 102, 0.2);
  padding: var(--spacing-md);
}

.tip-icon {
  font-size: 20px;
}

.streak-tip span {
  font-size: 13px;
  color: var(--text-secondary);
}

.streak-tip strong {
  color: var(--accent);
  font-weight: 700;
}
</style>
