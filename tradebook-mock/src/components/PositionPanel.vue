<template>
  <teleport to="body">
    <div v-if="store.ui.positionPanel" class="panel-overlay" @click.self="close">
      <div class="panel" data-testid="position-panel">
        <div class="panel-header">
          <span>POSITION MANAGEMENT</span>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div class="panel-body">
          <div v-if="!symbols.length" class="empty">No positions yet.</div>

          <table v-else class="pos-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Net Qty</th>
                <th>Avg Px</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="sym in symbols"
                :key="sym"
                data-testid="position-row"
                :data-symbol="sym"
              >
                <td :data-field="'symbol'">{{ sym }}</td>
                <td :data-field="'qty'" data-testid="position-qty">{{ store.positions[sym].qty }}</td>
                <td :data-field="'avgpx'">{{ avgPx(sym) }}</td>
                <td>
                  <button class="small-btn" @click="store.ui.positionDetail = sym">DETAIL</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Position detail drill-down -->
          <div v-if="store.ui.positionDetail" data-testid="position-detail-panel" class="detail-box">
            <div class="detail-header">
              EXECUTIONS — {{ store.ui.positionDetail }}
              <button class="small-btn" @click="store.ui.positionDetail = null">CLOSE</button>
            </div>
            <table class="pos-table">
              <thead>
                <tr><th>ExecID</th><th>Qty</th><th>Price</th><th>Order</th><th>Time</th></tr>
              </thead>
              <tbody>
                <tr
                  v-for="exec in detailExecs"
                  :key="exec.execId"
                  data-testid="position-exec-row"
                  :data-exec-id="exec.execId"
                >
                  <td :data-field="'execid'" style="font-size:.72rem">{{ exec.execId }}</td>
                  <td :data-field="'qty'">{{ exec.qty }}</td>
                  <td :data-field="'price'">{{ exec.price.toFixed(2) }}</td>
                  <td :data-field="'orderid'" style="font-size:.72rem">{{ exec.orderId }}</td>
                  <td style="font-size:.72rem">{{ fmtTime(exec.timestamp) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'
import { store } from '../store/useStore.js'

const symbols = computed(() => Object.keys(store.positions))

function avgPx(sym) {
  const pos = store.positions[sym]
  if (!pos || !pos.execs.length) return '0.00'
  const total = pos.execs.reduce((s, e) => s + e.qty * e.price, 0)
  const qty   = pos.execs.reduce((s, e) => s + e.qty, 0)
  return qty ? (total / qty).toFixed(2) : '0.00'
}

const detailExecs = computed(() => {
  const sym = store.ui.positionDetail
  if (!sym || !store.positions[sym]) return []
  return store.positions[sym].execs
})

function fmtTime(iso) { return iso ? new Date(iso).toLocaleTimeString() : '—' }
function close() { store.ui.positionPanel = false; store.ui.positionDetail = null }
</script>

<style scoped>
.panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.panel {
  background: #111827; border: 1px solid #2a3048; border-radius: 4px;
  width: 640px; max-width: 95vw; max-height: 80vh; display: flex; flex-direction: column;
}
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; border-bottom: 1px solid #2a3048;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.panel-body { overflow-y: auto; padding: .75rem 1rem; flex: 1; }
.empty { padding: 1rem; color: #4a5568; text-align: center; }
.pos-table { width: 100%; border-collapse: collapse; font-size: .78rem; }
.pos-table th {
  background: #0a0e1a; color: #8892a4; padding: .35rem .5rem;
  text-align: left; border-bottom: 1px solid #2a3048;
}
.pos-table td { padding: .3rem .5rem; border-bottom: 1px solid #1a1f2e; }
.small-btn {
  background: #1e2535; border: 1px solid #2a3048; color: #c8d0e0;
  padding: .15rem .4rem; border-radius: 2px; cursor: pointer; font-size: .72rem;
}
.small-btn:hover { border-color: #f0a500; color: #f0a500; }
.detail-box { margin-top: 1rem; border: 1px solid #2a3048; border-radius: 3px; padding: .65rem; }
.detail-header {
  display: flex; justify-content: space-between; align-items: center;
  font-size: .72rem; color: #f0a500; font-weight: 700; margin-bottom: .5rem;
}
</style>
