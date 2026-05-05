/**
 * Mock data for MooyuBao - 摸鱼宝
 * 职场人的碎片时间情绪代偿工具
 */

export const EVENT_TYPES = [
  { id: 'overtime', label: '差点加班', icon: '🌙', description: '躲过了无休止的加班' },
  { id: 'meeting', label: '差点开会', icon: '📋', description: '又一场无聊的会议' },
  { id: 'scold', label: '差点被骂', icon: '😰', description: '差点成为出气筒' },
  { id: 'blame', label: '差点背锅', icon: '🛡️', description: '成功避开了一口大锅' },
  { id: 'late', label: '差点迟到', icon: '🏃', description: '踩点大师的胜利' },
  { id: 'presentation', label: '差点做汇报', icon: '🎤', description: '不用当众社死了' },
  { id: 'group', label: '差点被拉群', icon: '👥', description: '群消息终于清净了' }
];

export const INDUSTRIES = [
  { id: 'internet', label: '互联网' },
  { id: 'finance', label: '金融' },
  { id: 'manufacture', label: '制造业' },
  { id: 'education', label: '教育' },
  { id: 'other', label: '其他' }
];

export const LEVELS = [
  { id: 'junior', label: 'P5及以下' },
  { id: 'mid', label: 'P6' },
  { id: 'senior', label: 'P7' },
  { id: 'lead', label: 'M1+' },
  { id: 'intern', label: '实习生' }
];

export const OVERTIME_LEVELS = [
  { id: 'never', label: '从不加班' },
  { id: 'sometimes', label: '偶尔加班' },
  { id: 'often', label: '经常加班' },
  { id: 'always', label: '天天加班' }
];

export const FISHING_STYLES = [
  { id: 'low', label: '低调型', description: '悄无声息地摸鱼' },
  { id: 'bold', label: '奔放型', description: '光明正大地休息' },
  { id: 'interval', label: '间歇型', description: '劳逸结合的艺术' }
];

export const WORK_YEARS = [
  { id: '0-1', label: '0-1年' },
  { id: '1-3', label: '1-3年' },
  { id: '3-5', label: '3-5年' },
  { id: '5-10', label: '5-10年' },
  { id: '10+', label: '10年+' }
];

// 统一成就体系（与 store 同步）
export const ACHIEVEMENTS = [
  { id: 'first_incident',    name: '初出茅庐',    icon: '🌟', description: '记录你的第一次摸鱼事件' },
  { id: 'ten_incidents',     name: '摸鱼老手',    icon: '🐟', description: '累计记录10次摸鱼事件' },
  { id: 'fifty_incidents',   name: '摸鱼大师',    icon: '🐠', description: '累计记录50次摸鱼事件' },
  { id: 'hundred_incidents', name: '摸鱼传奇',    icon: '🦈', description: '累计记录100次摸鱼事件' },
  { id: 'streak_7',          name: '一周不倒',    icon: '🔥', description: '连续7天记录摸鱼' },
  { id: 'streak_30',         name: '月度坚守',    icon: '💎', description: '连续30天记录摸鱼' },
  { id: 'overtime_king',     name: '加班之王',    icon: '👑', description: '记录10次加班摸鱼' },
  { id: 'meeting_survivor',  name: '会议幸存者',  icon: '🏆', description: '成功从无聊会议中摸鱼10次' },
  { id: 'all_types',          name: '全能选手',    icon: '🎯', description: '解锁所有摸鱼类型' },
  { id: 'buddy_found',       name: '找到搭档',    icon: '🤝', description: '匹配到一个摸鱼搭档' },
  { id: 'buddy_cover',       name: '互相掩护',    icon: '🛡️', description: '成功为搭档打掩护' },
  { id: 'perfect_week',      name: '完美摸鱼周',  icon: '⭐', description: '一周每天都有摸鱼记录' },
];

export const MOCK_INCIDENTS = [
  {
    id: '1',
    type: 'overtime',
    description: '今天准时下班了，老板居然没拦我！',
    date: new Date(Date.now() - 86400000).toISOString(),
    escaped: true
  },
  {
    id: '2',
    type: 'meeting',
    description: '那个无聊的周会临时取消了，我躲过去了',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    escaped: true
  },
  {
    id: '3',
    type: 'late',
    description: '地铁故障，我居然踩点到了',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    escaped: true
  }
];

export const MOCK_BUDDY = {
  matched: true,
  partner: {
    industry: '互联网',
    level: 'P6',
    overtime: '经常加班',
    style: '间歇型',
    workYears: '1-3年',
    matchScore: 92
  },
  matchedDate: new Date(Date.now() - 86400000 * 5).toISOString(),
  expiresDate: new Date(Date.now() + 86400000 * 2).toISOString()
};

export const DAILY_QUOTES = [
  '今天的你，已完成"准时下班"成就！',
  '记住，摸鱼是为了更好地工作（或者不是）',
  '同事问你为什么走这么早？就说"有约"',
  '摸鱼一时爽，一直摸鱼一直爽',
  '工作是为了生活，不是生活为了工作',
  '你已经比80%的同事更会生活了',
  '今天的不开心就到此为止吧',
  '摸鱼宝提醒您：适当休息，效率翻倍',
  '世界上最幸福的事，是周五下午没人找你',
  '愿你今天的会议都是取消的'
];

export function getRandomQuote() {
  return DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)];
}

export function getDaysUntilMonthEnd() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}