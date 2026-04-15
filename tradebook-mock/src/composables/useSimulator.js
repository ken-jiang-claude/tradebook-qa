import { applyFill, rejectOrder } from './useOrderMachine.js'
import { store } from '../store/useStore.js'

// Called once from BlotterView.vue on mount.
// Installs window functions that Playwright page.evaluate() calls.
export function installSimulator() {
  window.__simulateFill = ({ orderId, qty, price, execId, isFinal }) => {
    return applyFill(orderId, { qty, price, execId, isFinal })
  }

  window.__replayExec = ({ orderId, execId }) => {
    // intentionally uses same execId — dedup logic inside applyFill will reject it
    return applyFill(orderId, { qty: 1, price: 0, execId, isFinal: false })
  }

  window.__simulateReject = ({ orderId, reason }) => {
    return rejectOrder(orderId, reason || 'Order rejected by exchange')
  }

  window.__injectRhubBreak = ({ orderId, quantity }) => {
    store.rhubOverrides[orderId] = { quantity }
  }

  window.__getOrderId = () => {
    // returns the most recently created order ID — useful for step defs
    if (store.orders.length === 0) return null
    return store.orders[store.orders.length - 1].orderId
  }

  window.__seedPosition = ({ symbol, qty, price }) => {
    // Directly seed a position without requiring an order — for test preconditions
    if (!store.positions[symbol]) {
      store.positions[symbol] = { qty: 0, execs: [] }
    }
    store.positions[symbol].qty += qty
    store.positions[symbol].execs.push({
      execId: `SEED-${Date.now()}`,
      qty,
      price: price || 150.00,
      orderId: 'SEED',
      timestamp: new Date().toISOString(),
    })
  }

  window.__resetStore = () => {
    store.orders.length = 0
    store.execIds.clear()
    store.positions = {}
    store.logs.length = 0
    store.rhubOverrides = {}
    store._orderSeq = 0
    store.ui.overfillOrderId = null
  }
}
