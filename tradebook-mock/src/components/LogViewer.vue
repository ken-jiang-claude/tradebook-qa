<template>
  <teleport to="body">
    <div v-if="store.ui.logPanel" class="panel-overlay" @click.self="close">
      <div class="panel" data-testid="log-viewer">
        <div class="panel-header">
          <span>APPLICATION LOG</span>
          <button class="close-btn" @click="close">✕</button>
        </div>
        <div class="filter-bar">
          <input v-model="dateFilter"    data-testid="log-date-filter"    placeholder="Date filter…"     class="filter-input" />
          <input v-model="orderIdFilter" data-testid="log-orderid-filter" placeholder="Order ID filter…" class="filter-input" />
          <button data-testid="log-search-btn" class="small-btn" @click="() => {}">FILTER</button>
        </div>
        <div class="log-body">
          <div v-if="!filtered.length" class="empty">No log entries.</div>
          <div
            v-for="(entry, i) in filtered"
            :key="i"
            data-testid="log-entry"
            :class="['log-row', 'log-' + entry.level.toLowerCase()]"
          >
            <span data-testid="log-timestamp" class="log-ts">{{ entry.timestamp.replace('T', ' ').slice(0, 19) }}</span>
            <span data-testid="log-level"     class="log-level">{{ entry.level }}</span>
            <span data-testid="log-message"   class="log-msg">{{ entry.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store } from '../store/useStore.js'

const dateFilter    = ref('')
const orderIdFilter = ref('')

const filtered = computed(() => {
  return store.logs.filter(e => {
    if (dateFilter.value    && !e.timestamp.includes(dateFilter.value))  return false
    if (orderIdFilter.value && !e.message.includes(orderIdFilter.value)) return false
    return true
  })
})

function close() { store.ui.logPanel = false }
</script>

<style scoped>
.panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.panel {
  background: #111827; border: 1px solid #2a3048; border-radius: 4px;
  width: 760px; max-width: 95vw; max-height: 80vh; display: flex; flex-direction: column;
}
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; border-bottom: 1px solid #2a3048;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.filter-bar { display: flex; gap: .5rem; padding: .5rem 1rem; border-bottom: 1px solid #2a3048; }
.filter-input {
  background: #0a0e1a; border: 1px solid #2a3048; color: #c8d0e0;
  padding: .3rem .5rem; border-radius: 3px; outline: none; font-size: .75rem; flex: 1;
}
.filter-input:focus { border-color: #f0a500; }
.small-btn {
  background: #1e2535; border: 1px solid #2a3048; color: #c8d0e0;
  padding: .3rem .65rem; border-radius: 2px; cursor: pointer; font-size: .72rem;
}
.log-body { overflow-y: auto; flex: 1; padding: .5rem 1rem; font-size: .75rem; }
.empty { color: #4a5568; text-align: center; padding: 1rem; }
.log-row { display: flex; gap: .75rem; padding: .2rem 0; border-bottom: 1px solid #1a1f2e; line-height: 1.5; }
.log-ts    { color: #4a5568; white-space: nowrap; flex-shrink: 0; }
.log-level { width: 48px; flex-shrink: 0; font-weight: 700; }
.log-msg   { color: #c8d0e0; word-break: break-all; }
.log-info  .log-level { color: #8892a4; }
.log-warn  .log-level { color: #f0a500; }
.log-error .log-level { color: #dc322f; }
</style>
