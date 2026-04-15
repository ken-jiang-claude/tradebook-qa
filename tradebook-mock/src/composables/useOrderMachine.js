import { store, nextOrderId, nextClOrdId, nextExecId, addLog } from '../store/useStore.js'

const VALID_SYMBOLS   = ['AAPL', 'MSFT', 'TSLA', 'GOOG', 'AMZN']
const VALID_ACCOUNTS  = ['QA_TEST_ACCOUNT', 'QA_ACCOUNT', 'QA001', 'TEST_ACCOUNT']
const TERMINAL = ['Filled', 'Canceled', 'Partially Filled and Canceled', 'Rejected']

// ── T+2 settlement date (skip weekends) ──────────────────────
export function settlementDate(fromDate = new Date()) {
  let d = new Date(fromDate)
  let added = 0
  while (added < 2) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return d.toISOString().split('T')[0]
}

// ── Submit new order ─────────────────────────────────────────
export function submitOrder({ symbol, side, qty, price, orderType, account }) {
  qty   = Number(qty)
  price = Number(price)

  // Validation
  if (!symbol || !VALID_SYMBOLS.includes(symbol.toUpperCase())) {
    return { ok: false, error: `Unknown instrument: ${symbol}. Symbol not found.` }
  }
  if (!qty || qty <= 0) {
    return { ok: false, error: 'Invalid quantity: must be greater than 0.' }
  }
  if (price <= 0) {
    return { ok: false, error: 'Price must be greater than 0. Invalid price rejected.' }
  }
  if (account && !VALID_ACCOUNTS.includes(account.toUpperCase()) && account.toUpperCase() !== 'QA_TEST_ACCOUNT') {
    return { ok: false, error: `Invalid account: ${account}. Account not found or not authorized.` }
  }

  const orderId  = nextOrderId()
  const clOrdId  = nextClOrdId()
  const now      = new Date().toISOString()
  const userId   = store.session.user || 'qa_user'

  const order = {
    orderId,
    clOrdId,
    symbol:       symbol.toUpperCase(),
    side:         side || 'Buy',
    qty,
    price,
    orderType:    orderType || 'Limit',
    account:      account || 'QA_TEST_ACCOUNT',
    status:       'New',
    cumQty:       0,
    leavesQty:    qty,
    avgPx:        0,
    rejectReason: null,
    history: [{
      eventType: 'New',
      qty,
      price,
      cumQty:    0,
      execId:    null,
      timestamp: now,
      userId,
    }],
    createdAt: now,
    userId,
    _totalValue: 0,   // running total for VWAP calc
  }

  store.orders.push(order)
  addLog('INFO', `Order submitted: ${side} ${qty} ${symbol} @ ${price}`, orderId)
  return { ok: true, orderId, clOrdId }
}

// ── Modify order ─────────────────────────────────────────────
export function modifyOrder(orderId, { qty, price }) {
  const order = store.orders.find(o => o.orderId === orderId)
  if (!order) return { ok: false, error: 'Order not found.' }
  if (TERMINAL.includes(order.status)) {
    return { ok: false, error: `Cannot modify order in ${order.status} status.` }
  }
  qty   = Number(qty)
  price = Number(price)
  if (qty < order.cumQty) {
    return { ok: false, error: `New quantity (${qty}) is less than already filled quantity (${order.cumQty}).` }
  }

  order.qty       = qty
  order.price     = price
  order.leavesQty = qty - order.cumQty
  order.history.push({
    eventType: 'Replace',
    qty,
    price,
    cumQty:    order.cumQty,
    execId:    null,
    timestamp: new Date().toISOString(),
    userId:    store.session.user || 'qa_user',
  })
  addLog('INFO', `Order modified: qty=${qty} price=${price}`, orderId)
  return { ok: true }
}

// ── Cancel order ─────────────────────────────────────────────
export function cancelOrder(orderId) {
  const order = store.orders.find(o => o.orderId === orderId)
  if (!order) return { ok: false, error: 'Order not found.' }
  if (TERMINAL.includes(order.status)) {
    return { ok: false, error: `Cannot cancel order in ${order.status} status.` }
  }

  const newStatus = order.cumQty > 0 ? 'Partially Filled and Canceled' : 'Canceled'
  order.status    = newStatus
  order.leavesQty = 0
  order.history.push({
    eventType: 'Canceled',
    qty:       order.qty,
    price:     order.price,
    cumQty:    order.cumQty,
    execId:    null,
    timestamp: new Date().toISOString(),
    userId:    store.session.user || 'qa_user',
  })
  addLog('INFO', `Order canceled. Status: ${newStatus}`, orderId)
  return { ok: true }
}

// ── Apply fill ───────────────────────────────────────────────
export function applyFill(orderId, { qty, price, execId, isFinal }) {
  const order = store.orders.find(o => o.orderId === orderId)
  if (!order) return { ok: false, error: 'Order not found.' }
  if (TERMINAL.includes(order.status)) {
    return { ok: false, error: `Order is in terminal state: ${order.status}` }
  }

  qty   = Number(qty)
  price = Number(price)

  // Auto-generate execId if not provided
  if (!execId) execId = nextExecId()

  // Duplicate ExecID guard
  if (store.execIds.has(execId)) {
    addLog('WARN', `Duplicate ExecID rejected: ${execId}`, orderId)
    return { ok: false, error: `Duplicate ExecID: ${execId}` }
  }
  store.execIds.add(execId)

  // Overfill guard
  if (order.cumQty + qty > order.qty) {
    const allowed = order.qty - order.cumQty
    addLog('WARN', `Overfill detected. Requested ${qty}, allowed ${allowed}`, orderId)
    store.ui.overfillOrderId = orderId
    qty = allowed   // cap fill at remaining qty
    isFinal = true
  }

  // Update order
  order._totalValue = (order._totalValue || 0) + qty * price
  order.cumQty     += qty
  order.leavesQty   = order.qty - order.cumQty
  order.avgPx       = order.cumQty > 0 ? order._totalValue / order.cumQty : 0

  if (isFinal || order.leavesQty <= 0) {
    order.status    = 'Filled'
    order.leavesQty = 0
  } else {
    order.status = 'Partially Filled'
  }

  const event = {
    eventType: order.status === 'Filled' ? 'Filled' : 'Partially Filled',
    qty,
    price,
    cumQty:    order.cumQty,
    execId,
    timestamp: new Date().toISOString(),
    userId:    store.session.user || 'qa_user',
  }
  order.history.push(event)

  // Update positions
  if (!store.positions[order.symbol]) {
    store.positions[order.symbol] = { qty: 0, totalValue: 0, execs: [] }
  }
  const pos = store.positions[order.symbol]
  pos.qty        += (order.side === 'Buy' ? qty : -qty)
  pos.totalValue += qty * price
  pos.execs.push({ execId, qty, price, orderId, timestamp: event.timestamp })

  addLog('INFO', `Fill applied: qty=${qty} price=${price} execId=${execId} status=${order.status}`, orderId)
  return { ok: true, execId }
}

// ── Reject order ─────────────────────────────────────────────
export function rejectOrder(orderId, reason = 'Order rejected by exchange') {
  const order = store.orders.find(o => o.orderId === orderId)
  if (!order) return { ok: false, error: 'Order not found.' }

  order.status       = 'Rejected'
  order.rejectReason = reason
  order.leavesQty    = 0
  order.history.push({
    eventType: 'Rejected',
    qty:       order.qty,
    price:     order.price,
    cumQty:    0,
    execId:    null,
    timestamp: new Date().toISOString(),
    userId:    'exchange',
  })
  addLog('ERROR', `Order rejected: ${reason}`, orderId)
  return { ok: true }
}
