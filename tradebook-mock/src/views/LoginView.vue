<template>
  <div class="login-page">
    <div class="login-box" data-testid="login-form">
      <div class="login-header">
        <div class="login-logo">TB</div>
        <div class="login-title">TradeBook</div>
        <div class="login-env" data-testid="env-banner">ALPHA — NON-PRODUCTION</div>
      </div>

      <form @submit.prevent="doLogin">
        <div class="field">
          <label>Username</label>
          <input
            v-model="username"
            data-testid="username-input"
            autocomplete="username"
            placeholder="qa_user"
          />
        </div>
        <div class="field">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            data-testid="password-input"
            autocomplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <div v-if="error" class="login-error" data-testid="login-error">{{ error }}</div>

        <button type="submit" class="login-btn" data-testid="login-submit">
          LOG IN
        </button>
      </form>

      <div class="login-footer">Mock environment — no real orders are placed</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { store, addLog } from '../store/useStore.js'

const router   = useRouter()
const username = ref('')
const password = ref('')
const error    = ref('')

function doLogin() {
  if (!username.value || !password.value) {
    error.value = 'Username and password are required.'
    return
  }
  if (username.value !== 'qa_user' || password.value !== 'qa_password') {
    error.value = 'Invalid credentials. Please try again.'
    return
  }
  store.session.user     = username.value
  store.session.loggedIn = true
  error.value = ''
  addLog('INFO', `User session started: ${username.value}`)
  router.push('/blotter')
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0a0e1a;
}
.login-box {
  background: #111827;
  border: 1px solid #2a3048;
  border-radius: 4px;
  padding: 2rem;
  width: 340px;
}
.login-header { text-align: center; margin-bottom: 1.5rem; }
.login-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px; height: 48px;
  background: #f0a500;
  color: #000;
  font-weight: 900;
  font-size: 1.2rem;
  border-radius: 4px;
  margin-bottom: .5rem;
}
.login-title { font-size: 1.2rem; font-weight: 700; color: #f0a500; }
.login-env {
  font-size: .7rem;
  color: #f0a500;
  border: 1px solid #f0a500;
  display: inline-block;
  padding: .1rem .4rem;
  border-radius: 2px;
  margin-top: .3rem;
  letter-spacing: .06em;
}
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: .75rem; color: #8892a4; margin-bottom: .3rem; letter-spacing: .05em; }
.field input {
  width: 100%;
  background: #0a0e1a;
  border: 1px solid #2a3048;
  color: #c8d0e0;
  padding: .5rem .65rem;
  border-radius: 3px;
  outline: none;
}
.field input:focus { border-color: #f0a500; }
.login-error {
  background: rgba(220,50,47,.15);
  border: 1px solid #dc322f;
  color: #dc322f;
  padding: .4rem .6rem;
  border-radius: 3px;
  font-size: .78rem;
  margin-bottom: .75rem;
}
.login-btn {
  width: 100%;
  background: #f0a500;
  color: #000;
  border: none;
  padding: .6rem;
  font-weight: 700;
  letter-spacing: .08em;
  border-radius: 3px;
  cursor: pointer;
}
.login-btn:hover { background: #ffb820; }
.login-footer { font-size: .68rem; color: #4a5568; text-align: center; margin-top: 1rem; }
</style>
