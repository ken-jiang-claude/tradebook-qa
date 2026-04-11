<template>
  <teleport to="body">
    <div v-if="store.ui.sessionPanel" class="panel-overlay" @click.self="close">
      <div class="panel" data-testid="session-monitor-panel">
        <div class="panel-header">
          <span>SESSION MONITOR</span>
          <button class="close-btn" @click="close">✕</button>
        </div>
        <div class="panel-body">
          <div class="field-grid">
            <div class="label">Session Status</div>
            <div data-testid="sim-session-status" style="color:#00c851">Connected</div>
            <div class="label">Last Heartbeat</div>
            <div data-testid="sim-heartbeat-time">{{ heartbeat }}</div>
            <div class="label">Inbound Seq Num</div>
            <div data-testid="in-seq-num">{{ seqNum }}</div>
            <div class="label">Seq Gap Warning</div>
            <div data-testid="seq-gap-warning" style="color:#8892a4">None</div>
            <div class="label">Session Hours</div>
            <div data-testid="market-session-hours">08:00 – 17:00 ET</div>
            <div class="label">Business Date</div>
            <div data-testid="business-date">{{ today }}</div>
            <div class="label">Settlement Cycle</div>
            <div data-testid="settlement-cycle">T+2</div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { store } from '../store/useStore.js'

const heartbeat = ref(new Date().toISOString())
const seqNum    = ref(1)
const today     = new Date().toISOString().split('T')[0]

let timer
onMounted(() => {
  timer = setInterval(() => {
    heartbeat.value = new Date().toISOString()
    seqNum.value += 1
  }, 5000)
})
onUnmounted(() => clearInterval(timer))

function close() { store.ui.sessionPanel = false }
</script>

<style scoped>
.panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.panel { background: #111827; border: 1px solid #2a3048; border-radius: 4px; width: 420px; max-width: 95vw; }
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; border-bottom: 1px solid #2a3048;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.panel-body { padding: .75rem 1rem; }
.field-grid { display: grid; grid-template-columns: 160px 1fr; gap: .5rem .75rem; font-size: .8rem; }
.label { color: #8892a4; }
</style>
