<template>
  <div class="blotter-wrap">
    <table class="blotter-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Symbol</th>
          <th>Side</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Status</th>
          <th>CumQty</th>
          <th>LeavesQty</th>
          <th>AvgPx</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!orders.length">
          <td colspan="10" class="empty">No orders. Click NEW ORDER to begin.</td>
        </tr>
        <tr
          v-for="order in orders"
          :key="order.orderId"
          :data-testid="'blotter-row'"
          :data-order-id="order.orderId"
          :data-symbol="order.symbol"
          :data-status="order.status"
          :class="['order-row', statusClass(order.status)]"
          @contextmenu.prevent="onContextMenu($event, order.orderId)"
        >
          <td :data-testid="'order-id-cell'" :data-field="'orderid'">{{ order.orderId }}</td>
          <td :data-testid="'order-symbol'"  :data-field="'symbol'">{{ order.symbol }}</td>
          <td :data-testid="'order-side'"    :data-field="'side'">{{ order.side }}</td>
          <td :data-testid="'order-qty'"     :data-field="'qty'">{{ order.qty }}</td>
          <td :data-testid="'order-price'"   :data-field="'price'">{{ order.price.toFixed(2) }}</td>
          <td :data-testid="'order-status'"  :data-field="'status'" :class="statusClass(order.status)">
            {{ order.status }}
            <span
              v-if="order.rejectReason"
              :data-testid="'reject-reason'"
              :data-order-id="order.orderId"
              style="display:block; font-size:.68rem; color:#dc322f; opacity:.8;"
            >{{ order.rejectReason }}</span>
          </td>
          <td :data-testid="'order-cumqty'"  :data-field="'cumqty'">{{ order.cumQty }}</td>
          <td :data-testid="'order-leavesqty'" :data-field="'leavesqty'">{{ order.leavesQty }}</td>
          <td :data-testid="'order-avgpx'"   :data-field="'avgpx'">{{ order.avgPx ? order.avgPx.toFixed(2) : '0.00' }}</td>
          <td class="action-cell">
            <button
              :data-testid="'history-btn'"
              :data-order-id="order.orderId"
              class="action-btn"
              @click.stop="openHistory(order.orderId)"
            >H</button>
            <button
              :data-testid="'modify-btn'"
              :data-order-id="order.orderId"
              class="action-btn"
              :disabled="isTerminal(order.status)"
              @click.stop="openModify(order.orderId)"
            >M</button>
            <button
              :data-testid="'cancel-btn'"
              :data-order-id="order.orderId"
              class="action-btn action-btn-cancel"
              :disabled="isTerminal(order.status)"
              @click.stop="openCancel(order.orderId)"
            >X</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { store } from '../store/useStore.js'

const orders = computed(() => [...store.orders].reverse())

const TERMINAL = ['Filled', 'Canceled', 'Partially Filled and Canceled', 'Rejected']
function isTerminal(status) { return TERMINAL.includes(status) }

function statusClass(status) {
  if (status === 'Filled')    return 'status-filled'
  if (status === 'Canceled' || status === 'Partially Filled and Canceled') return 'status-canceled'
  if (status === 'Rejected')  return 'status-rejected'
  if (status === 'Partially Filled') return 'status-partial'
  return 'status-new'
}

function onContextMenu(e, orderId) {
  store.ui.contextMenu = { x: e.clientX, y: e.clientY, orderId }
}

function openHistory(orderId) { store.ui.historyPanel = orderId }
function openModify(orderId)  { store.ui.modifyForm   = orderId }
function openCancel(orderId)  { store.ui.cancelDialog = orderId }
</script>

<style scoped>
.blotter-wrap { overflow-x: auto; }
.blotter-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .78rem;
}
.blotter-table th {
  background: #111827;
  color: #8892a4;
  padding: .4rem .6rem;
  text-align: left;
  font-weight: 600;
  letter-spacing: .04em;
  border-bottom: 1px solid #2a3048;
  white-space: nowrap;
}
.blotter-table td {
  padding: .35rem .6rem;
  border-bottom: 1px solid #1a1f2e;
  white-space: nowrap;
}
.order-row:hover { background: #111827; }
.empty { color: #4a5568; text-align: center; padding: 1.5rem; }

.action-cell { display: flex; gap: .3rem; }
.action-btn {
  background: #1e2535;
  border: 1px solid #2a3048;
  color: #c8d0e0;
  padding: .15rem .4rem;
  border-radius: 2px;
  cursor: pointer;
  font-size: .72rem;
}
.action-btn:hover:not(:disabled) { border-color: #f0a500; color: #f0a500; }
.action-btn:disabled { opacity: .3; cursor: not-allowed; }
.action-btn-cancel:hover:not(:disabled) { border-color: #dc322f; color: #dc322f; }

.status-new      { color: #c8d0e0; }
.status-partial  { color: #f0a500; }
.status-filled   { color: #00c851; }
.status-canceled { color: #8892a4; }
.status-rejected { color: #dc322f; }
</style>
