import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/incident',
    name: 'incident',
    component: () => import('../views/IncidentView.vue')
  },
  {
    path: '/buddy',
    name: 'buddy',
    component: () => import('../views/BuddyView.vue')
  },
  {
    path: '/mine',
    name: 'mine',
    component: () => import('../views/MineView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;