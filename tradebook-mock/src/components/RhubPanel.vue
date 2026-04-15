<template>
  <teleport to="body">
    <div v-if="store.ui.rhubPanel" class="panel-overlay" @click.self="close">
      <div class="panel" data-testid="rhub-panel">
        <div class="panel-header">
          <span>RHUB VALIDATION</span>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div class="panel-body">
          <!-- Status sub-panel (always visible) -->
          <div data-testid="rhub-status-panel" class="status-box">
            <button data-testid="rhub-status-btn" class="small-btn" @click="() => {}">RHUB STATUS</button>
            <span data-testid="rhub-run-status" style="color:#00c851; margin-left:.75rem;">Completed</span>
          </div>

          <!-- Search -->
          <div class="search-row">
            <input
              v-model="searchTerm"
              data-testid="rhub-search-input"
              placeholder="Enter Order ID or ClOrdID…"
              @keyup.enter="doSearch"
            />
            <button data-testid="rhub-search-submit" class="small-btn" @click="doSearch">SEARCH</button>
          </div>
          <div class="field-note" style="margin-bottom:.5rem;">Order ID and ClOrdID are case-sensitive.</div>

          <!-- Result -->
          <div v-if="searchError" class="error-box">{{ searchError }}</div>

          <div v-if="result" data-testid="rhub-record" class="result-box">
            <div class="result-grid">
              <div class="result-label">Symbol</div>
              <div data-testid="rhub-field-symbol">{{ result.symbol }}</div>
              <div class="result-label">Quantity</div>
              <div data-testid="rhub-field-quantity">{{ result.cumQty }}</div>
              <div class="result-label">Avg Price</div>
              <div data-testid="rhub-field-price">{{ result.avgPx.toFixed(2) }}</div>
              <div class="result-label">Account</div>
              <div data-testid="rhub-field-account">{{ result.account }}</div>
              <div class="result-label">Settlement Date</div>
              <div data-testid="rhub-field-settlement-date">{{ result.settlementDate }}</div>
            </div>

            <!-- Recon -->
            <div style="margin-top:1rem;">
              <button data-testid="rhub-recon-btn" class="small-btn" @click="showRecon = !showRecon">
                {{ showRecon ? 'HIDE RECON' : 'VIEW RECON' }}
              </button>
            </div>

            <div v-if="showRecon" data-testid="rhub-recon-panel" class="recon-box">
              <div>
                Recon Status:
                <strong
                  data-testid="rhub-recon-status"
                  :style="{ color: reconStatus === 'MATCHED' ? '#00c851' : '#dc322f' }"
                >{{ reconStatus }}</strong>
              </div>
              <div v-if="reconStatus === 'BREAK'" data-testid="rhub-break-detail" class="break-detail">
                {{ breakDetail }}
              </div>
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
import { settlementDate } from '../composables/useOrderMachine.js'

const searchTerm  = ref('')
const result      = ref(null)
const searchError = ref('')
const showRecon   = ref(false)

watch(() => store.ui.rhubPanel, (v) => {
  if (v) { searchTerm.value = ''; result.value = null; searchError.value = ''; showRecon.value = false }
})

function doSearch() {
  searchError.value = ''
  result.value      = null
  showRecon.value   = false
  const term  = searchTerm.value.trim()
  const order = store.orders.find(o =>
    (o.orderId === term || o.clOrdId === term) &&
    o.status !== 'Canceled' && o.status !== 'Rejected' && o.cumQty > 0
  )
  if (!order) {
    searchError.value = `No RHUB record found for "${term}".`
    return
  }
  result.value = {
    ...order,
    settlementDate: settlementDate(new Date(order.createdAt)),
  }
}

const reconStatus = computed(() => {
  if (!result.value) return 'MATCHED'
  const override = store.rhubOverrides[result.value.orderId]
  if (override && override.quantity !== result.value.cumQty) return 'BREAK'
  return 'MATCHED'
})

const breakDetail = computed(() => {
  if (!result.value) return ''
  const override = store.rhubOverrides[result.value.orderId]
  if (!override) return ''
  return `Quantity mismatch: TradeBook=${result.value.cumQty}, RHUB=${override.quantity}`
})

function close() { store.ui.rhubPanel = false }
</script>

<style scoped>
.panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.panel {
  background: #111827; border: 1px solid #2a3048; border-radius: 4px;
  width: 560px; max-width: 95vw; max-height: 80vh; display: flex; flex-direction: column;
}
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; border-bottom: 1px solid #2a3048;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.panel-body { overflow-y: auto; padding: .75rem 1rem; flex: 1; }
.status-box { margin-bottom: .75rem; display: flex; align-items: center; }
.search-row { display: flex; gap: .5rem; margin-bottom: .75rem; }
.search-row input {
  flex: 1; background: #0a0e1a; border: 1px solid #2a3048;
  color: #c8d0e0; padding: .4rem .6rem; border-radius: 3px; outline: none;
}
.search-row input:focus { border-color: #f0a500; }
.small-btn {
  background: #1e2535; border: 1px solid #2a3048; color: #c8d0e0;
  padding: .3rem .65rem; border-radius: 2px; cursor: pointer; font-size: .72rem; white-space: nowrap;
}
.small-btn:hover { border-color: #f0a500; color: #f0a500; }
.error-box {
  background: rgba(220,50,47,.12); border-left: 3px solid #dc322f;
  color: #dc322f; padding: .4rem .6rem; font-size: .78rem; border-radius: 2px;
}
.result-box { background: #0a0e1a; border: 1px solid #2a3048; border-radius: 3px; padding: .75rem; }
.result-grid { display: grid; grid-template-columns: 140px 1fr; gap: .35rem .75rem; font-size: .8rem; }
.result-label { color: #8892a4; }
.recon-box { margin-top: .75rem; background: #111827; border: 1px solid #2a3048; border-radius: 3px; padding: .65rem; font-size: .82rem; }
.break-detail { color: #dc322f; margin-top: .4rem; font-size: .78rem; }
</style>
