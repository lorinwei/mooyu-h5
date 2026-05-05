<template>
  <div class="incident-card" :class="{ new: isNew }">
    <div class="card-icon">{{ eventType?.icon || '🎯' }}</div>
    <div class="card-content">
      <div class="incident-header">
        <span class="incident-type">{{ eventType?.label || '未知事件' }}</span>
        <span class="incident-time">{{ formatTime }}</span>
      </div>
      <p class="incident-desc">{{ incident.description || '成功躲过这一劫！' }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useMooyuStore } from '../stores/mooyu';

const props = defineProps({
  incident: { type: Object, required: true }
});

const store = useMooyuStore();
const eventType = computed(() => store.getEventType(props.incident.type));

const formatTime = computed(() => {
  const date = new Date(props.incident.date);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
});

const isNew = ref(false);
onMounted(() => {
  isNew.value = (new Date() - new Date(props.incident.date)) < 3600000;
});
</script>

<style scoped>
.incident-card {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  transition: all var(--transition-fast);
}

.incident-card:active {
  transform: scale(0.98);
  border-color: var(--primary);
}

.incident-card.new {
  border-left: 3px solid var(--success);
  background: rgba(6, 214, 160, 0.04);
}

.card-icon {
  width: 46px;
  height: 46px;
  background: var(--bg-surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.card-content { flex: 1; min-width: 0; }

.incident-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.incident-type {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.incident-time {
  font-size: 11px;
  color: var(--text-dim);
}

.incident-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
}
</style>
