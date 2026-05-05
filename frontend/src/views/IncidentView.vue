<template>
  <div class="incident-view">
    <div class="page-header animate-slide-up">
      <h2 class="page-title">劫后余生</h2>
      <p class="page-subtitle">记录那些差点发生的坏事，证明你又活过了一天</p>
    </div>

    <!-- 记录按钮 -->
    <button v-if="!isRecording" class="record-btn btn btn-primary animate-slide-up" style="animation-delay:80ms" @click="startRecord">
      <Plus :size="20" />
      记录今天的差点
    </button>

    <!-- 记录表单 -->
    <div v-else class="record-form card animate-slide-up">
      <h3 class="form-title">记录一个差点</h3>

      <EventTypePicker
        v-if="!selectedType"
        :selected-id="selectedType"
        @select="selectType"
      />

      <div v-else class="description-form">
        <div class="selected-type">
          <span class="type-icon">{{ selectedTypeInfo?.icon }}</span>
          <span class="type-label">{{ selectedTypeInfo?.label }}</span>
          <button class="change-btn" @click="selectedType = ''">重选</button>
        </div>

        <textarea
          v-model="description"
          class="input description-input"
          placeholder="当时是什么情况？你是怎么躲过去的？"
          rows="4"
        ></textarea>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="cancelRecord">取消</button>
          <button class="btn btn-primary" @click="submitIncident" :disabled="!description.trim()">
            提交记录
          </button>
        </div>
      </div>
    </div>

    <!-- 今日汇总 -->
    <div v-if="store.todayIncidents.length > 0" class="today-summary card animate-slide-up" style="animation-delay:160ms">
      <div class="summary-header">
        <span class="summary-title">今日战果</span>
        <span class="summary-count">{{ store.todayIncidents.length }} 个差点</span>
      </div>
      <div class="summary-types">
        <div v-for="type in todayTypeStats" :key="type.id" class="type-stat">
          <span class="type-icon">{{ type.icon }}</span>
          <span class="type-count">{{ type.count }}</span>
        </div>
      </div>
    </div>

    <!-- 差一点提示 -->
    <div v-if="store.daysUntilMonthEnd <= 3 && store.daysUntilMonthEnd > 0"
         class="almost-hint card animate-slide-up" style="animation-delay:200ms">
      <span>🔥 本月还差 {{ store.daysUntilMonthEnd }} 天满勤，继续加油！</span>
    </div>

    <!-- 空状态 -->
    <div v-if="store.incidents.length === 0" class="empty-state card animate-slide-up" style="animation-delay:160ms">
      <span class="empty-icon">🎉</span>
      <h4>今天没有差点？</h4>
      <p>说明你今天很幸运！不过如果发生了什么，<br>记得回来记录哦~</p>
    </div>

    <!-- 历史记录 -->
    <div v-else class="history-section animate-slide-up" style="animation-delay:240ms">
      <h3 class="section-title">历史记录</h3>
      <div class="incident-list">
        <IncidentCard
          v-for="incident in store.incidents.slice(0, 10)"
          :key="incident.id"
          :incident="incident"
        />
      </div>
      <button v-if="store.incidents.length > 10" class="btn btn-secondary load-more">
        加载更多
      </button>
    </div>

    <!-- 提交成功弹窗 -->
    <Modal v-if="showSuccess" @close="showSuccess = false">
      <div class="success-modal">
        <div class="success-icon">🎊</div>
        <h3>这个劫你逃掉了！</h3>
        <p>本月累计 {{ store.totalEscapes }} 个差点</p>
        <button class="btn btn-primary" @click="showSuccess = false">继续摸鱼</button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Plus } from 'lucide-vue-next';
import { useMooyuStore } from '../stores/mooyu';
import EventTypePicker from '../components/EventTypePicker.vue';
import IncidentCard from '../components/IncidentCard.vue';
import Modal from '../components/Modal.vue';
import { EVENT_TYPES } from '../api/mock';

const store = useMooyuStore();
const isRecording = ref(false);
const selectedType = ref('');
const description = ref('');
const showSuccess = ref(false);

const selectedTypeInfo = computed(() =>
  EVENT_TYPES.find(t => t.id === selectedType.value)
);

const todayTypeStats = computed(() => {
  const counts = {};
  store.todayIncidents.forEach(inc => {
    counts[inc.type] = (counts[inc.type] || 0) + 1;
  });
  return EVENT_TYPES
    .filter(t => counts[t.id])
    .map(t => ({ ...t, count: counts[t.id] }));
});

function startRecord() {
  isRecording.value = true;
  selectedType.value = '';
  description.value = '';
}

function selectType(typeId) {
  selectedType.value = typeId;
}

function cancelRecord() {
  isRecording.value = false;
  selectedType.value = '';
  description.value = '';
}

function submitIncident() {
  if (!description.value.trim()) return;
  store.addIncident(selectedType.value, description.value);
  showSuccess.value = true;
  isRecording.value = false;
  selectedType.value = '';
  description.value = '';
}
</script>

<style scoped>
.incident-view {
  padding-bottom: var(--spacing-xl);
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
}

.record-btn {
  width: 100%;
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  font-size: 16px;
}

.record-form {
  margin-bottom: var(--spacing-lg);
  background: var(--bg-card);
}

.form-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.selected-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 107, 53, 0.08);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 107, 53, 0.2);
}

.type-icon {
  font-size: 22px;
}

.type-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--primary);
  flex: 1;
}

.change-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}

.description-input {
  resize: none;
  margin-bottom: var(--spacing-md);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
}

.form-actions .btn {
  flex: 1;
}

.today-summary {
  margin-bottom: var(--spacing-md);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.summary-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.summary-count {
  font-size: 13px;
  color: var(--primary);
  font-weight: 600;
}

.summary-types {
  display: flex;
  gap: var(--spacing-lg);
}

.type-stat {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-icon { font-size: 18px; }

.type-count {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
}

.almost-hint {
  background: rgba(255, 209, 102, 0.06);
  border-color: rgba(255, 209, 102, 0.2);
  text-align: center;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.almost-hint span {
  font-size: 13px;
  color: var(--accent);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
}

.empty-icon {
  font-size: 56px;
  display: block;
  margin-bottom: var(--spacing-md);
}

.empty-state h4 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.history-section {
  margin-top: var(--spacing-lg);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
  letter-spacing: 1px;
}

.incident-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.load-more {
  width: 100%;
  margin-top: var(--spacing-md);
}

.success-modal {
  text-align: center;
  padding: var(--spacing-lg) 0;
}

.success-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
  animation: bounce 0.5s ease-out;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.success-modal h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.success-modal p {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}
</style>
