<template>
  <teleport to="body">
    <div v-if="store.ui.simPanel" class="panel-overlay" @click.self="close">
      <div class="panel" data-testid="simulator-panel">
        <div class="panel-header">
          <span>⚡ FILL SIMULATOR</span>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div class="panel-body">
          <!-- No open orders -->
          <div v-if="!openOrders.length" class="empty">
            No open orders. Submit a new order first.
          </div>

          <template v-else>
            <!-- Order selector -->
            <div class="field">
              <label>Select Order</label>
              <select v-model="selectedOrderId" class="input">
                <option v-for="o in openOrders" :key="o.orderId" :value="o.orderId">
                  {{ o.orderId }} — {{ o.side }} {{ o.qty }} {{ o.symbol }} @ {{ o.price }} ({{ o.status }}, leaves {{ o.leavesQty }})
                </option>
              </select>
            </div>

            <template v-if="selectedOrder">
              <div class="order-summary">
                <span class="tag">{{ selectedOrder.symbol }}</span>
                <span class="tag">{{ selectedOrder.side }}</span>
                <span>Leaves: <strong>{{ selectedOrder.leavesQty }}</strong></span>
                <span>CumQty: <strong>{{ selectedOrder.cumQty }}</strong></span>
                <span>AvgPx: <strong>{{ selectedOrder.avgPx.toFixed(2) }}</strong></span>
              </div>

              <!-- Fill inputs -->
              <div class="field-row">
                <div class="field">
                  <label>Fill Qty</label>
                  <input v-model="fillQty" type="number" min="1" :max="selectedOrder.leavesQty" class="input" placeholder="e.g. 100" />
                </div>
                <div class="field">
                  <label>Fill Price</label>
                  <input v-model="fillPrice" type="number" step="0.01" class="input" :placeholder="selectedOrder.price" />
                </div>
              </div>

              <div class="field">
                <label>Fill Type</label>
                <div class="radio-row">
                  <label class="radio-label">
                    <input type="radio" v-model="fillType" value="partial" /> Partial Fill
                  </label>
                  <label class="radio-label">
                    <input type="radio" v-model="fillType" value="full" /> Full Fill (use remaining LeavesQty)
                  </label>
                </div>
              </div>

              <!-- Feedback -->
              <div v-if="feedback" class="feedback" :class="feedbackClass">{{ feedback }}</div>

              <!-- Actions -->
              <div class="btn-row">
                <button class="btn-fill" @click="doFill">⚡ INJECT FILL</button>
                <button class="btn-reject" @click="doReject">✗ REJECT ORDER</button>
              </div>
            </template>
          </template>

          <!-- Recent fill log -->
          <div v-if="log.length" class="fill-log">
            <div class="log-title">RECENT FILLS</div>
            <div v-for="(entry, i) in log" :key="i" class="log-entry">
              {{ entry }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { store } from '../store/useStore.js'
import { applyFill, rejectOrder } from '../composables/useOrderMachine.js'

const TERMINAL = ['Filled', 'Canceled', 'Partially Filled and Canceled', 'Rejected']

const selectedOrderId = ref(null)
const fillQty         = ref('')
const fillPrice       = ref('')
const fillType        = ref('partial')
const feedback        = ref('')
const feedbackClass   = ref('')
const log             = ref([])

const openOrders = computed(() =>
  store.orders.filter(o => !TERMINAL.includes(o.status))
)

const selectedOrder = computed(() =>
  store.orders.find(o => o.orderId === selectedOrderId.value)
)

// Auto-select first open order
watch(openOrders, (orders) => {
  if (!selectedOrderId.value && orders.length) {
    selectedOrderId.value = orders[0].orderId
  }
}, { immediate: true })

// Pre-fill price from order
watch(selectedOrder, (o) => {
  if (o) fillPrice.value = o.price
})

function doFill() {
  feedback.value = ''
  const order = selectedOrder.value
  if (!order) return

  let qty = fillType.value === 'full'
    ? order.leavesQty
    : Number(fillQty.value)

  if (!qty || qty <= 0) {
    feedback.value = 'Enter a valid fill quantity.'
    feedbackClass.value = 'error'
    return
  }

  const price    = Number(fillPrice.value) || order.price
  const isFinal  = fillType.value === 'full' || qty >= order.leavesQty
  const result   = applyFill(order.orderId, { qty, price, isFinal })

  if (!result.ok) {
    feedback.value      = result.error
    feedbackClass.value = 'error'
    return
  }

  const status = isFinal ? 'Filled' : 'Partially Filled'
  feedback.value      = `✓ Fill applied — ${qty} @ ${price.toFixed(2)} → ${status}`
  feedbackClass.value = 'success'
  log.value.unshift(`${order.orderId} | ${qty} @ ${price.toFixed(2)} | ExecID: ${result.execId} | ${status}`)
  if (log.value.length > 10) log.value.pop()
  fillQty.value = ''
}

function doReject() {
  const order = selectedOrder.value
  if (!order) return
  const result = rejectOrder(order.orderId, 'Rejected by simulator')
  if (result.ok) {
    feedback.value      = `✗ Order ${order.orderId} rejected.`
    feedbackClass.value = 'error'
    log.value.unshift(`${order.orderId} | REJECTED`)
  }
}

function close() { store.ui.simPanel = false }
</script>

<style scoped>
.panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.panel {
  background: #111827; border: 1px solid #f0a500; border-radius: 4px;
  width: 520px; max-width: 95vw; max-height: 85vh; display: flex; flex-direction: column;
}
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; border-bottom: 1px solid #2a3048;
  font-size: .75rem; letter-spacing: .08em; color: #f0a500; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.panel-body { overflow-y: auto; padding: .85rem 1rem; flex: 1; }
.empty { color: #4a5568; text-align: center; padding: 1rem; }

.field { margin-bottom: .75rem; }
.field label { display: block; font-size: .72rem; color: #8892a4; margin-bottom: .25rem; letter-spacing: .04em; }
.input {
  width: 100%; background: #0a0e1a; border: 1px solid #2a3048;
  color: #c8d0e0; padding: .4rem .6rem; border-radius: 3px; outline: none;
}
.input:focus { border-color: #f0a500; }

.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }

.order-summary {
  display: flex; flex-wrap: wrap; gap: .5rem; align-items: center;
  margin-bottom: .85rem; font-size: .78rem; color: #8892a4;
}
.order-summary strong { color: #c8d0e0; }
.tag {
  background: #1e2535; border: 1px solid #2a3048; border-radius: 2px;
  padding: .1rem .4rem; font-size: .72rem; color: #f0a500;
}

.radio-row { display: flex; gap: 1.25rem; }
.radio-label { display: flex; align-items: center; gap: .35rem; cursor: pointer; font-size: .8rem; color: #c8d0e0; }
.radio-label input { accent-color: #f0a500; }

.feedback {
  padding: .4rem .65rem; border-radius: 3px; font-size: .8rem; margin-bottom: .75rem;
}
.feedback.success { background: rgba(0,200,81,.12); border-left: 3px solid #00c851; color: #00c851; }
.feedback.error   { background: rgba(220,50,47,.12); border-left: 3px solid #dc322f; color: #dc322f; }

.btn-row { display: flex; gap: .6rem; }
.btn-fill {
  flex: 1; background: #f0a500; color: #000; border: none;
  padding: .55rem; font-weight: 700; letter-spacing: .06em; border-radius: 3px; cursor: pointer;
}
.btn-fill:hover { background: #ffb820; }
.btn-reject {
  flex: 1; background: transparent; color: #dc322f; border: 1px solid #dc322f;
  padding: .5rem; font-weight: 700; letter-spacing: .06em; border-radius: 3px; cursor: pointer;
}
.btn-reject:hover { background: rgba(220,50,47,.12); }

.fill-log { margin-top: 1rem; border-top: 1px solid #2a3048; padding-top: .65rem; }
.log-title { font-size: .65rem; letter-spacing: .08em; color: #8892a4; margin-bottom: .4rem; }
.log-entry { font-size: .72rem; color: #4a5568; padding: .15rem 0; border-bottom: 1px solid #1a1f2e; }
</style>
