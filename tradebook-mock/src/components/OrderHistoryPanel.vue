<template>
  <teleport to="body">
    <div v-if="store.ui.historyPanel" class="panel-overlay" @click.self="close">
      <div class="panel" data-testid="order-history-panel">
        <div class="panel-header">
          <span>ORDER HISTORY — {{ store.ui.historyPanel }}</span>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div v-if="order" class="panel-body">
          <div class="final-status">
            Status: <strong :data-testid="'history-final-status'">{{ order.status }}</strong>
          </div>

          <table class="history-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Qty</th>
                <th>Price</th>
                <th>CumQty</th>
                <th>ExecID</th>
                <th>Timestamp</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(evt, i) in order.history"
                :key="i"
                data-testid="history-event"
                :data-event-type="evt.eventType"
                :data-timestamp="evt.timestamp"
                :data-user-id="evt.userId"
                :data-exec-id="evt.execId || ''"
              >
                <td :data-field="'event-type'">{{ evt.eventType }}</td>
                <td :data-field="'qty'">{{ evt.qty }}</td>
                <td :data-field="'price'">{{ evt.price?.toFixed(2) }}</td>
                <td :data-field="'cumqty'">{{ evt.cumQty }}</td>
                <td :data-field="'execid'" style="color:#8892a4; font-size:.72rem">{{ evt.execId || '—' }}</td>
                <td :data-field="'timestamp'" style="font-size:.72rem">{{ fmtTime(evt.timestamp) }}</td>
                <td :data-field="'userid'" style="color:#8892a4">{{ evt.userId }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty">Order not found.</div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'
import { store } from '../store/useStore.js'

const order = computed(() =>
  store.orders.find(o => o.orderId === store.ui.historyPanel)
)

function fmtTime(iso) {
  return iso ? new Date(iso).toLocaleTimeString() : '—'
}

function close() { store.ui.historyPanel = null }
</script>

<style scoped>
.panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.panel {
  background: #111827; border: 1px solid #2a3048; border-radius: 4px;
  width: 720px; max-width: 95vw; max-height: 80vh; display: flex; flex-direction: column;
}
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; border-bottom: 1px solid #2a3048;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.panel-body { overflow-y: auto; padding: .75rem 1rem; flex: 1; }
.final-status { margin-bottom: .75rem; font-size: .82rem; color: #8892a4; }
.final-status strong { color: #c8d0e0; }
.history-table { width: 100%; border-collapse: collapse; font-size: .75rem; }
.history-table th {
  background: #0a0e1a; color: #8892a4; padding: .35rem .5rem;
  text-align: left; border-bottom: 1px solid #2a3048;
}
.history-table td { padding: .3rem .5rem; border-bottom: 1px solid #1a1f2e; }
.empty { padding: 1rem; color: #4a5568; text-align: center; }
</style>
