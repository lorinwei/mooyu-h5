<template>
  <div class="buddy-view">
    <!-- 未完成画像 -->
    <div v-if="!store.isProfileComplete" class="card profile-prompt animate-slide-up">
      <div class="prompt-icon">📋</div>
      <h3>先完成职场画像</h3>
      <p>告诉我们你是哪种打工人，才能找到最配的搭子</p>
      <button class="btn btn-primary" @click="showQuiz = true">去填写</button>
    </div>

    <!-- 已匹配搭子 -->
    <div v-else-if="store.buddy.matched" class="buddy-section animate-slide-up">
      <div class="section-header">
        <h3>你的搭子</h3>
        <span class="expires-hint">还剩 {{ daysUntilExpires }} 天续约</span>
      </div>

      <div class="buddy-card card card-glow">
        <div class="buddy-avatar">{{ partnerInitial }}</div>
        <div class="buddy-info">
          <div class="buddy-tags">
            <span class="buddy-tag" v-for="tag in partnerTags" :key="tag">{{ tag }}</span>
          </div>
          <div class="match-score">
            <div class="score-bar">
              <div class="score-fill" :style="{ width: store.buddy.partner.matchScore + '%' }"></div>
            </div>
            <span class="score-text">匹配度 {{ store.buddy.partner.matchScore }}%</span>
          </div>
        </div>
      </div>

      <div class="buddy-actions">
        <button class="btn btn-primary" @click="showCoverRequest = true">
          <Shield :size="18" />
          发掩护请求
        </button>
        <button class="btn btn-secondary" @click="handleBreakup">分手搭子</button>
      </div>

      <div class="buddy-tips card">
        <h4>💡 掩护请求是什么？</h4>
        <p>当你需要临时消失（比如接电话、去洗手间），让搭子帮你盯着点，有老板来就互相通风报信</p>
      </div>
    </div>

    <!-- 正在匹配 -->
    <div v-else class="matching-section animate-slide-up">
      <div class="matching-header">
        <h3>正在为你匹配搭子...</h3>
        <p>基于你的职场画像，找一个同频的打工人</p>
      </div>
      <div class="matching-loader">
        <div class="loader-circle"></div>
        <p>算法匹配中</p>
      </div>
      <button class="btn btn-secondary" @click="showQuiz = true">重新填写画像</button>
    </div>

    <!-- 画像弹窗 -->
    <Modal v-if="showQuiz" title="职场画像" @close="showQuiz = false">
      <div class="quiz-form">
        <div class="quiz-step" v-for="question in quizQuestions" :key="question.id">
          <label class="quiz-label">{{ question.label }}</label>
          <div class="quiz-options">
            <button
              v-for="option in question.options"
              :key="option.id"
              class="quiz-option"
              :class="{ selected: quizAnswers[question.id] === option.id }"
              @click="quizAnswers[question.id] = option.id"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <button class="btn btn-primary btn-full" @click="submitProfile" :disabled="!isQuizComplete">
          完成画像
        </button>
      </div>
    </Modal>

    <!-- 掩护请求弹窗 -->
    <Modal v-if="showCoverRequest" title="🛡️ 发起掩护" @close="showCoverRequest = false">
      <div class="cover-request">
        <p>确认向搭子发送掩护请求？</p>
        <p class="cover-hint">搭子会收到你的求助信号</p>
        <div class="cover-actions">
          <button class="btn btn-secondary" @click="showCoverRequest = false">取消</button>
          <button class="btn btn-primary" @click="sendCover">确认发送</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Shield } from 'lucide-vue-next';
import { useMooyuStore } from '../stores/mooyu';
import Modal from '../components/Modal.vue';
import { INDUSTRIES, LEVELS, OVERTIME_LEVELS, FISHING_STYLES, WORK_YEARS } from '../api/mock';

const store = useMooyuStore();
const showQuiz = ref(false);
const showCoverRequest = ref(false);

const quizQuestions = [
  { id: 'industry', label: '你在哪个行业？', options: INDUSTRIES },
  { id: 'level', label: '你的职级？', options: LEVELS },
  { id: 'overtime', label: '加班强度？', options: OVERTIME_LEVELS },
  { id: 'style', label: '摸鱼风格？', options: FISHING_STYLES },
  { id: 'workYears', label: '工作几年了？', options: WORK_YEARS }
];

const quizAnswers = ref({ ...store.profile });

const isQuizComplete = computed(() =>
  quizQuestions.every(q => quizAnswers.value[q.id])
);

const partnerInitial = computed(() => {
  if (!store.buddy.partner) return '?';
  return (store.buddy.partner.level || '搭').charAt(0);
});

const partnerTags = computed(() => {
  if (!store.buddy.partner) return [];
  const p = store.buddy.partner;
  return [p.industry, p.level, p.overtime, p.style].filter(Boolean);
});

const daysUntilExpires = computed(() => {
  if (!store.buddy.expiresDate) return 0;
  return Math.max(0, Math.ceil((new Date(store.buddy.expiresDate) - new Date()) / 86400000));
});

function submitProfile() {
  store.updateProfile(quizAnswers.value);
  showQuiz.value = false;
  if (!store.buddy.matched) {
    const score = Math.floor(Math.random() * 15) + 80;
    store.matchBuddy({
      industry: quizAnswers.value.industry,
      level: quizAnswers.value.level,
      overtime: quizAnswers.value.overtime,
      style: quizAnswers.value.style,
      workYears: quizAnswers.value.workYears,
      matchScore: score
    });
  }
}

function sendCover() {
  store.sendCoverRequest();
  showCoverRequest.value = false;
  alert('掩护请求已发送！搭子收到信号了 🛡️');
}

function handleBreakup() {
  if (confirm('确定要和搭子分手吗？')) store.breakUpBuddy();
}
</script>

<style scoped>
.buddy-view { padding-bottom: var(--spacing-xl); }

.profile-prompt {
  text-align: center;
  padding: var(--spacing-xl);
}

.prompt-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.profile-prompt h3 {
  font-size: 18px;
  margin-bottom: var(--spacing-sm);
}

.profile-prompt p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.expires-hint {
  font-size: 12px;
  color: var(--text-dim);
  background: var(--bg-surface);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.buddy-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.buddy-avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 0 20px var(--primary-glow);
}

.buddy-info { flex: 1; min-width: 0; }

.buddy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: var(--spacing-sm);
}

.buddy-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--bg-surface);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
}

.match-score {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.score-bar {
  flex: 1;
  height: 5px;
  background: var(--bg-surface);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: var(--gradient-success);
  border-radius: var(--radius-full);
  transition: width 0.5s ease-out;
}

.score-text {
  font-size: 12px;
  color: var(--success);
  font-weight: 600;
  white-space: nowrap;
}

.buddy-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.buddy-actions .btn { flex: 1; min-width: 0; }

.buddy-tips {
  background: rgba(255, 107, 53, 0.05);
  border-color: rgba(255, 107, 53, 0.2);
}

.buddy-tips h4 {
  font-size: 14px;
  margin-bottom: var(--spacing-sm);
}

.buddy-tips p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.matching-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.matching-header h3 { font-size: 18px; margin-bottom: var(--spacing-sm); }
.matching-header p { font-size: 14px; color: var(--text-secondary); }

.matching-loader {
  text-align: center;
  padding: var(--spacing-xl);
}

.loader-circle {
  width: 60px;
  height: 60px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  margin: 0 auto var(--spacing-lg);
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.matching-loader p { color: var(--text-secondary); font-size: 14px; }

.quiz-form { padding: var(--spacing-md); }

.quiz-step { margin-bottom: var(--spacing-lg); }

.quiz-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.quiz-options { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }

.quiz-option {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.quiz-option.selected {
  border-color: var(--primary);
  background: rgba(255, 107, 53, 0.1);
  color: var(--primary);
}

.quiz-option:active { transform: scale(0.96); }

.btn-full { width: 100%; margin-top: var(--spacing-md); }

.cover-request {
  text-align: center;
  padding: var(--spacing-md);
}

.cover-request p { font-size: 15px; margin-bottom: var(--spacing-sm); }
.cover-hint { color: var(--text-secondary); font-size: 13px; }

.cover-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.cover-actions .btn { flex: 1; }
</style>
