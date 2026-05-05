<template>
  <div class="achievement-badge" :class="{ unlocked: isUnlocked, locked: !isUnlocked, new: isNew }">
    <div class="badge-icon">
      <span class="icon">{{ achievement?.icon || '🏅' }}</span>
      <div v-if="!isUnlocked" class="lock-overlay">
        <Lock :size="16" />
      </div>
    </div>
    <div class="badge-info">
      <span class="badge-name">{{ achievement?.name || '未知成就' }}</span>
      <span class="badge-desc">{{ achievement?.description || '' }}</span>
    </div>
    <div v-if="!isUnlocked && progress < 100" class="progress-ring">
      <svg viewBox="0 0 36 36">
        <circle class="ring-bg" cx="18" cy="18" r="15" fill="none" stroke-width="3" />
        <circle
          class="ring-fill"
          cx="18" cy="18" r="15" fill="none" stroke-width="3"
          :stroke-dasharray="`${progress}, 100`" stroke-linecap="round"
        />
      </svg>
      <span class="progress-text">{{ Math.round(progress) }}%</span>
    </div>
    <div v-if="isUnlocked" class="unlocked-mark">
      <CheckCircle :size="20" />
    </div>
  </div>
</template>

<script setup>
import { Lock, CheckCircle } from 'lucide-vue-next';

const props = defineProps({
  achievement: { type: Object, required: true },
  progress: { type: Number, default: 0 },
  isUnlocked: { type: Boolean, default: false },
  isNew: { type: Boolean, default: false }
});
</script>

<style scoped>
.achievement-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.achievement-badge.locked { opacity: 0.6; }

.achievement-badge.unlocked {
  border-color: rgba(255, 209, 102, 0.3);
  box-shadow: 0 0 20px rgba(255, 209, 102, 0.08);
}

.achievement-badge.unlocked::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(255, 209, 102, 0.06) 0%, transparent 100%);
  pointer-events: none;
}

.achievement-badge.new {
  animation: glow 1.5s ease-in-out;
}

.badge-icon {
  width: 48px;
  height: 48px;
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  position: relative;
}

.achievement-badge.unlocked .badge-icon {
  background: linear-gradient(135deg, rgba(255, 209, 102, 0.2), rgba(255, 107, 53, 0.15));
  box-shadow: 0 0 15px rgba(255, 209, 102, 0.15);
}

.lock-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(13, 13, 26, 0.7);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}

.badge-info { flex: 1; min-width: 0; }

.badge-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.achievement-badge.locked .badge-name { color: var(--text-secondary); }

.badge-desc {
  display: block;
  font-size: 11px;
  color: var(--text-dim);
  line-height: 1.4;
}

.progress-ring {
  width: 44px;
  height: 44px;
  position: relative;
  flex-shrink: 0;
}

.progress-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg { stroke: var(--border); }

.ring-fill {
  stroke: var(--primary);
  transition: stroke-dasharray 500ms ease-out;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
}

.unlocked-mark { color: var(--success); }

@keyframes glow {
  0%, 100% { box-shadow: 0 0 10px rgba(255, 209, 102, 0.2); }
  50% { box-shadow: 0 0 30px rgba(255, 209, 102, 0.5), 0 0 60px rgba(255, 209, 102, 0.2); }
}
</style>
