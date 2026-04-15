<template>
  <div class="mkt-bar">
    <input
      v-model="symbolInput"
      data-testid="symbol-search"
      placeholder="Symbol…"
      class="mkt-input"
      @keyup.enter="loadQuote"
    />
    <div v-if="quote" data-testid="quote-panel" class="quote-panel">
      <span class="quote-sym">{{ quote.symbol }}</span>
      <span class="quote-label">BID</span>
      <span :data-testid="'quote-bid'" :data-symbol="quote.symbol" class="quote-bid">{{ quote.bid.toFixed(2) }}</span>
      <span class="quote-label">ASK</span>
      <span data-testid="quote-ask" class="quote-ask">{{ quote.ask.toFixed(2) }}</span>
      <span data-testid="quote-timestamp" :data-ts="quote.ts" class="quote-ts">{{ fmtTime(quote.ts) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const BASE_PRICES = { AAPL: 189.5, MSFT: 415.2, TSLA: 172.3, GOOG: 175.8, AMZN: 185.4 }
const symbolInput = ref('')
const quote       = ref(null)
let   timer       = null

function loadQuote() {
  const sym = symbolInput.value.trim().toUpperCase()
  if (!BASE_PRICES[sym]) { quote.value = null; return }
  startTick(sym)
}

function startTick(sym) {
  if (timer) clearInterval(timer)
  tick(sym)
  timer = setInterval(() => tick(sym), 5000)
}

function tick(sym) {
  const base = BASE_PRICES[sym]
  const mid  = base + (Math.random() - 0.5) * 2
  quote.value = { symbol: sym, bid: mid - 0.02, ask: mid + 0.02, ts: new Date().toISOString() }
}

function fmtTime(iso) { return new Date(iso).toLocaleTimeString() }
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.mkt-bar { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
.mkt-input {
  background: #0a0e1a; border: 1px solid #2a3048; color: #c8d0e0;
  padding: .25rem .5rem; border-radius: 3px; width: 80px; outline: none; font-size: .78rem;
}
.mkt-input:focus { border-color: #f0a500; }
.quote-panel { display: flex; align-items: center; gap: .4rem; font-size: .78rem; }
.quote-sym   { color: #f0a500; font-weight: 700; }
.quote-label { color: #8892a4; font-size: .68rem; }
.quote-bid   { color: #00c851; font-weight: 600; }
.quote-ask   { color: #dc322f; font-weight: 600; }
.quote-ts    { color: #4a5568; font-size: .68rem; }
</style>
