<template>
  <div class="app-container">
    <!-- 动态背景光晕 -->
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
    </div>

    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">🐟</span>
          <div class="logo-text">
            <span class="logo-title">摸鱼宝</span>
            <span class="logo-sub">职场喘息站</span>
          </div>
        </div>
        <div class="header-right">
          <div v-if="store.unlockedAchievements.length > 0" class="achievement-btn" @click="goToMine">
            <span class="badge-dot"></span>
            <span>{{ store.unlockedAchievements.length }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部导航 -->
    <BottomNav />

    <!-- 成就解锁弹窗 -->
    <Modal
      v-if="showNewAchievement"
      :title="'🎉 新成就解锁！'"
      @close="showNewAchievement = false"
    >
      <div class="achievement-unlock">
        <div class="unlock-icon">{{ newAchievement?.icon }}</div>
        <h3 class="unlock-name">{{ newAchievement?.name }}</h3>
        <p class="unlock-desc">{{ newAchievement?.description }}</p>
        <button class="btn btn-primary" @click="showNewAchievement = false">太棒了！</button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMooyuStore } from './stores/mooyu';
import BottomNav from './components/BottomNav.vue';
import Modal from './components/Modal.vue';

const router = useRouter();
const store = useMooyuStore();

const showNewAchievement = ref(false);
const newAchievement = ref(null);

function goToMine() {
  router.push('/mine');
}

watch(
  () => store.achievements,
  (newVal, oldVal) => {
    for (const [key, value] of Object.entries(newVal)) {
      if (value?.unlocked && !oldVal?.[key]?.unlocked) {
        const achievement = store.getAchievement(key);
        if (achievement) {
          newAchievement.value = achievement;
          showNewAchievement.value = true;
          break;
        }
      }
    }
  },
  { deep: true }
);

onMounted(() => {
  store.updateDailyQuote();
  store.trackActiveDay();
});
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  position: relative;
}

/* 背景光晕 */
.bg-orbs {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: orbFloat 15s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 107, 53, 0.12) 0%, transparent 70%);
  top: -80px;
  left: -80px;
  animation-delay: 0s;
}

.orb-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(255, 209, 102, 0.08) 0%, transparent 70%);
  bottom: 100px;
  right: -60px;
  animation-delay: -5s;
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, 50px) scale(1.1); }
  66% { transform: translate(-20px, 30px) scale(0.95); }
}

/* Header */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(13, 13, 26, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  max-width: var(--max-width);
  margin: 0 auto;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  height: var(--header-height);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo-icon {
  font-size: 28px;
  filter: drop-shadow(0 0 8px rgba(255, 107, 53, 0.4));
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.logo-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.logo-sub {
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.achievement-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.achievement-btn:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent);
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Main */
.app-main {
  flex: 1;
  padding-top: calc(var(--header-height) + var(--spacing-md));
  padding-bottom: calc(var(--nav-height) + var(--spacing-md));
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

/* Achievement unlock modal */
.achievement-unlock {
  text-align: center;
  padding: var(--spacing-lg) 0;
}

.unlock-icon {
  font-size: 72px;
  margin-bottom: var(--spacing-md);
  animation: bounceIn 0.6s cubic-bezier(0.36, 0, 0.66, -0.56);
  filter: drop-shadow(0 0 20px var(--accent-glow));
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.unlock-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: var(--spacing-sm);
}

.unlock-desc {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
  font-size: 14px;
}
</style>
