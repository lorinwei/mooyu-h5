<template>
  <div class="buddy-card" :class="{ matched: isMatched }">
    <!-- 未配对状态 -->
    <template v-if="!isMatched">
      <div class="buddy-empty">
        <span class="buddy-emoji">🔍</span>
        <h4>还没有搭子</h4>
        <p>先完成职场画像，开启匹配之旅</p>
        <button class="btn btn-primary" @click="$emit('startQuiz')">
          填写画像
        </button>
      </div>
    </template>
    
    <!-- 已配对状态 -->
    <template v-else>
      <div class="buddy-header">
        <div class="buddy-avatar">
          <span>{{ buddy.partner?.style?.charAt(0) || '🤝' }}</span>
        </div>
        <div class="buddy-info">
          <div class="buddy-tags">
            <span class="tag">{{ buddy.partner?.industry || '互联网' }}</span>
            <span class="tag">{{ buddy.partner?.level || 'P6' }}</span>
            <span class="tag">{{ buddy.partner?.overtime || '经常加班' }}</span>
          </div>
          <div class="match-score">
            <span class="score-label">匹配度</span>
            <span class="score-value">{{ buddy.partner?.matchScore || 85 }}%</span>
          </div>
        </div>
      </div>
      
      <div class="buddy-details">
        <div class="detail-row">
          <span class="detail-label">摸鱼风格</span>
          <span class="detail-value">{{ buddy.partner?.style || '间歇型' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">工龄</span>
          <span class="detail-value">{{ buddy.partner?.workYears || '1-3年' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">配对日期</span>
          <span class="detail-value">{{ formatDate }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">到期时间</span>
          <span class="detail-value expires" :class="{ urgent: isExpiringSoon }">
            {{ formatExpiry }}
          </span>
        </div>
      </div>
      
      <div class="buddy-actions">
        <button class="btn btn-danger" @click="$emit('cover')">
          <AlertTriangle :size="16" />
          掩护请求
        </button>
        <button class="btn btn-secondary" @click="$emit('breakup')">
          解除关系
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';

const props = defineProps({
  buddy: {
    type: Object,
    default: () => ({ matched: false })
  }
});

defineEmits(['startQuiz', 'cover', 'breakup']);

const isMatched = computed(() => props.buddy?.matched);

const formatDate = computed(() => {
  if (!props.buddy?.matchedDate) return '';
  const date = new Date(props.buddy.matchedDate);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
});

const formatExpiry = computed(() => {
  if (!props.buddy?.expiresDate) return '';
  const date = new Date(props.buddy.expiresDate);
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return '已到期';
  if (diffDays === 0) return '今天到期';
  if (diffDays === 1) return '明天到期';
  return `${diffDays}天后到期`;
});

const isExpiringSoon = computed(() => {
  if (!props.buddy?.expiresDate) return false;
  const date = new Date(props.buddy.expiresDate);
  const now = new Date();
  const diffMs = date - now;
  return diffMs < 2 * 24 * 60 * 60 * 1000; // Less than 2 days
});
</script>

<style scoped>
.buddy-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.buddy-empty {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
}

.buddy-emoji {
  font-size: 48px;
  display: block;
  margin-bottom: var(--spacing-md);
}

.buddy-empty h4 {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.buddy-empty p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.buddy-header {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.buddy-avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  flex-shrink: 0;
}

.buddy-info {
  flex: 1;
}

.buddy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.tag {
  background: var(--background);
  color: var(--text-secondary);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.match-score {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.score-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.score-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--success);
}

.buddy-details {
  background: var(--background);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.detail-row:not(:last-child) {
  border-bottom: 1px solid var(--border);
}

.detail-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.detail-value.expires {
  color: var(--danger);
}

.detail-value.expires:not(.urgent) {
  color: var(--text-primary);
}

.buddy-actions {
  display: flex;
  gap: var(--spacing-md);
}

.buddy-actions .btn {
  flex: 1;
}
</style>