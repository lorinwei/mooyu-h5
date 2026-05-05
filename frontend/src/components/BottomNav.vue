<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
      <Home :size="22" />
      <span class="nav-label">首页</span>
    </router-link>
    <router-link to="/incident" class="nav-item" :class="{ active: $route.path === '/incident' }">
      <Shield :size="22" />
      <span class="nav-label">劫后余生</span>
    </router-link>
    <router-link to="/buddy" class="nav-item" :class="{ active: $route.path === '/buddy' }">
      <Users :size="22" />
      <span class="nav-label">搭子</span>
    </router-link>
    <router-link to="/mine" class="nav-item" :class="{ active: $route.path === '/mine' }">
      <User :size="22" />
      <span class="nav-label">我的</span>
    </router-link>
  </nav>
</template>

<script setup>
import { Home, Shield, Users, User } from 'lucide-vue-next';
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  background: rgba(13, 13, 26, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  max-width: var(--max-width);
  margin: 0 auto;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-dim);
  text-decoration: none;
  transition: all var(--transition-fast);
  min-width: 64px;
  position: relative;
}

.nav-item::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 20px;
  height: 2px;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  transition: transform var(--transition-fast);
}

.nav-item.active::after {
  transform: translateX(-50%) scaleX(1);
}

.nav-item:active { transform: scale(0.93); }

.nav-item.active {
  color: var(--primary);
}

.nav-item.active svg {
  stroke: var(--primary);
  filter: drop-shadow(0 0 6px var(--primary-glow));
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style>
