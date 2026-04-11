import { reactive } from 'vue'

export const store = reactive({
  // ── Auth ────────────────────────────────────────────────────
  session: { user: null, loggedIn: false },

  // ── Orders ──────────────────────────────────────────────────
  orders: [],
  execIds: new Set(),   // dedup guard
  _orderSeq: 0,

  // ── Positions: symbol -> { qty, totalValue, execs[] } ───────
  positions: {},

  // ── Application log ─────────────────────────────────────────
  logs: [],

  // ── RHUB break overrides ─────────────────────────────────────
  rhubOverrides: {},    // orderId -> { quantity }

  // ── UI panel visibility ──────────────────────────────────────
  ui: {
    contextMenu:     null,   // { x, y, orderId } | null
    orderForm:       false,
    modifyForm:      null,   // orderId | null
    cancelDialog:    null,   // orderId | null
    historyPanel:    null,   // orderId | null
    settlementPanel: false,
    rhubPanel:       false,
    positionPanel:   false,
    positionDetail:  null,   // symbol | null
    sessionPanel:    false,
    healthPanel:     false,
    accountPanel:    false,
    instrumentPanel: false,
    logPanel:        false,
    simPanel:        false,
    overfillOrderId: null,
  },
})

export function nextOrderId() {
  store._orderSeq += 1
  return `ORD-${String(store._orderSeq).padStart(4, '0')}`
}

export function nextClOrdId() {
  return `CLORD-${String(store._orderSeq).padStart(4, '0')}`
}

let _execSeq = 0
export function nextExecId() {
  _execSeq += 1
  return `EXEC-${String(_execSeq).padStart(6, '0')}`
}

export function addLog(level, message, orderId = null) {
  store.logs.unshift({
    timestamp: new Date().toISOString(),
    level,
    message: orderId ? `[${orderId}] ${message}` : message,
  })
  if (store.logs.length > 500) store.logs.pop()
}
