<template>
  <teleport to="body">
    <div v-if="store.ui.settlementPanel" class="panel-overlay" @click.self="close">
      <div class="panel" data-testid="settlement-report-panel">
        <div class="panel-header">
          <span>SETTLEMENT REPORT</span>
          <div style="display:flex;gap:.5rem;align-items:center">
            <button class="action-btn" data-testid="settlement-refresh-btn" @click="() => {}">↻ REFRESH</button>
            <button class="close-btn" @click="close">✕</button>
          </div>
        </div>

        <!-- Sentinel: always present once panel is open -->
        <span data-testid="settlement-report-loaded" style="display:none"></span>

        <div class="panel-body">
          <div v-if="!rows.length" class="empty">No filled orders to settle.</div>
          <table v-else class="settle-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Account</th>
                <th>Trade Date</th>
                <th>Settlement Date</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.orderId"
                data-testid="settlement-row"
                :data-order-id="row.orderId"
              >
                <td :data-field="'orderid'">{{ row.orderId }}</td>
                <td :data-field="'symbol'">{{ row.symbol }}</td>
                <td :data-field="'side'">{{ row.side }}</td>
                <td :data-field="'quantity'">{{ row.cumQty }}</td>
                <td :data-field="'price'">{{ row.avgPx.toFixed(2) }}</td>
                <td :data-field="'account'">{{ row.account }}</td>
                <td :data-field="'trade_date'">{{ row.tradeDate }}</td>
                <td :data-field="'settlement_date'" :data-testid="'settlement-date-' + row.orderId">{{ row.settlementDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'
import { store } from '../store/useStore.js'
import { settlementDate } from '../composables/useOrderMachine.js'

const FILLED = ['Filled', 'Partially Filled and Canceled']

const rows = computed(() =>
  store.orders
    .filter(o => FILLED.includes(o.status) || o.cumQty > 0)
    .map(o => ({
      ...o,
      tradeDate:      o.createdAt.split('T')[0],
      settlementDate: settlementDate(new Date(o.createdAt)),
    }))
)

function close() { store.ui.settlementPanel = false }
</script>

<style scoped>
.panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.panel {
  background: #111827; border: 1px solid #2a3048; border-radius: 4px;
  width: 820px; max-width: 95vw; max-height: 80vh; display: flex; flex-direction: column;
}
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; border-bottom: 1px solid #2a3048;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.action-btn {
  background: #1e2535; border: 1px solid #2a3048; color: #c8d0e0;
  padding: .2rem .5rem; border-radius: 2px; cursor: pointer; font-size: .72rem;
}
.action-btn:hover { border-color: #f0a500; color: #f0a500; }
.panel-body { overflow-y: auto; padding: .75rem 1rem; flex: 1; }
.empty { padding: 1rem; color: #4a5568; text-align: center; }
.settle-table { width: 100%; border-collapse: collapse; font-size: .75rem; }
.settle-table th {
  background: #0a0e1a; color: #8892a4; padding: .35rem .5rem;
  text-align: left; border-bottom: 1px solid #2a3048;
}
.settle-table td { padding: .3rem .5rem; border-bottom: 1px solid #1a1f2e; }
</style>
