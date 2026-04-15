import { createRouter, createWebHistory } from 'vue-router'
import { store } from '../store/useStore.js'
import LoginView  from '../views/LoginView.vue'
import BlotterView from '../views/BlotterView.vue'

const routes = [
  { path: '/login',   name: 'login',   component: LoginView },
  { path: '/blotter', name: 'blotter', component: BlotterView, meta: { requiresAuth: true } },
  { path: '/',        redirect: '/blotter' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !store.session.loggedIn) {
    return { name: 'login' }
  }
})

export default router
