<template>
  <teleport to="body">
    <transition name="slide">
      <div
        v-if="store.ui.overfillOrderId"
        data-testid="overfill-alert"
        class="overfill-alert"
      >
        <div class="alert-icon">⚠</div>
        <div class="alert-body">
          <div class="alert-title">OVERFILL PROTECTION TRIGGERED</div>
          <div class="alert-sub">Order {{ store.ui.overfillOrderId }} — fill capped at remaining LeavesQty</div>
        </div>
        <button class="dismiss-btn" @click="store.ui.overfillOrderId = null">✕</button>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { watch } from 'vue'
import { store } from '../store/useStore.js'

// Auto-dismiss after 8 seconds
watch(() => store.ui.overfillOrderId, (v) => {
  if (v) setTimeout(() => { store.ui.overfillOrderId = null }, 8000)
})
</script>

<style scoped>
.overfill-alert {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999;
  background: #1a0f00; border: 1px solid #f0a500; border-radius: 4px;
  padding: .85rem 1rem; display: flex; align-items: flex-start; gap: .75rem;
  max-width: 360px; box-shadow: 0 4px 16px rgba(0,0,0,.5);
}
.alert-icon { font-size: 1.4rem; color: #f0a500; flex-shrink: 0; }
.alert-body { flex: 1; }
.alert-title { color: #f0a500; font-weight: 700; font-size: .78rem; letter-spacing: .05em; }
.alert-sub   { color: #c8d0e0; font-size: .75rem; margin-top: .25rem; }
.dismiss-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; flex-shrink: 0; }
.slide-enter-active, .slide-leave-active { transition: all .3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(1rem); }
</style>
