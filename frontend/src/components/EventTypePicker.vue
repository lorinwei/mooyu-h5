<template>
  <div class="event-type-picker">
    <div class="picker-title">选择差点事件类型</div>
    <div class="type-grid">
      <button
        v-for="type in eventTypes"
        :key="type.id"
        class="type-item"
        :class="{ selected: selectedId === type.id }"
        @click="$emit('select', type.id)"
      >
        <span class="type-icon">{{ type.icon }}</span>
        <span class="type-label">{{ type.label }}</span>
        <span class="type-desc">{{ type.description }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { EVENT_TYPES } from '../api/mock';

defineProps({ selectedId: { type: String, default: '' } });
defineEmits(['select']);

const eventTypes = EVENT_TYPES;
</script>

<style scoped>
.event-type-picker { width: 100%; }

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--bg-surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.type-item:hover {
  border-color: var(--primary);
  background: rgba(255, 107, 53, 0.06);
  box-shadow: 0 0 15px var(--primary-glow);
}

.type-item.selected {
  border-color: var(--primary);
  background: rgba(255, 107, 53, 0.1);
  transform: scale(1.02);
  box-shadow: 0 0 20px var(--primary-glow);
}

.type-item:active { transform: scale(0.97); }

.type-icon { font-size: 30px; line-height: 1; }

.type-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.type-desc {
  font-size: 11px;
  color: var(--text-dim);
  line-height: 1.3;
}
</style>
