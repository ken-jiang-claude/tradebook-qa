<template>
  <teleport to="body">
    <div v-if="store.ui.instrumentPanel" class="panel-overlay" @click.self="close">
      <div class="panel">
        <div class="panel-header">
          <span>SECURITY MASTER SEARCH</span>
          <button class="close-btn" @click="close">✕</button>
        </div>
        <div class="panel-body">
          <div class="search-row">
            <input
              v-model="query"
              data-testid="instrument-search-input"
              placeholder="Symbol (e.g. AAPL)"
              @keyup.enter="doSearch"
            />
            <button class="small-btn" @click="doSearch">SEARCH</button>
          </div>
          <div v-if="result" data-testid="instrument-result" class="result-box">
            <div class="field-grid">
              <div class="label">Symbol</div><div>{{ result.symbol }}</div>
              <div class="label">Status</div>
              <div data-testid="instrument-status" style="color:#00c851">{{ result.status }}</div>
              <div class="label">Exchange</div>
              <div data-testid="instrument-exchange">{{ result.exchange }}</div>
              <div class="label">Currency</div>
              <div data-testid="instrument-currency">{{ result.currency }}</div>
              <div class="label">Lot Size</div>
              <div data-testid="instrument-lot-size">{{ result.lotSize }}</div>
            </div>
          </div>
          <div v-if="notFound" class="error-box">Symbol "{{ query }}" not found in security master.</div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref } from 'vue'
import { store } from '../store/useStore.js'

const INSTRUMENTS = {
  AAPL: { symbol: 'AAPL', status: 'Tradable', exchange: 'NASDAQ', currency: 'USD', lotSize: 1 },
  MSFT: { symbol: 'MSFT', status: 'Tradable', exchange: 'NASDAQ', currency: 'USD', lotSize: 1 },
  TSLA: { symbol: 'TSLA', status: 'Tradable', exchange: 'NASDAQ', currency: 'USD', lotSize: 1 },
  GOOG: { symbol: 'GOOG', status: 'Tradable', exchange: 'NASDAQ', currency: 'USD', lotSize: 1 },
  AMZN: { symbol: 'AMZN', status: 'Tradable', exchange: 'NASDAQ', currency: 'USD', lotSize: 1 },
}

const query    = ref('')
const result   = ref(null)
const notFound = ref(false)

function doSearch() {
  result.value   = null
  notFound.value = false
  const sym = query.value.trim().toUpperCase()
  if (INSTRUMENTS[sym]) { result.value = INSTRUMENTS[sym] }
  else { notFound.value = true }
}

function close() { store.ui.instrumentPanel = false; result.value = null; notFound.value = false }
</script>

<style scoped>
.panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.panel { background: #111827; border: 1px solid #2a3048; border-radius: 4px; width: 400px; max-width: 95vw; }
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; border-bottom: 1px solid #2a3048;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.panel-body { padding: .75rem 1rem; }
.search-row { display: flex; gap: .5rem; margin-bottom: .75rem; }
.search-row input {
  flex: 1; background: #0a0e1a; border: 1px solid #2a3048;
  color: #c8d0e0; padding: .4rem .6rem; border-radius: 3px; outline: none;
}
.search-row input:focus { border-color: #f0a500; }
.small-btn {
  background: #1e2535; border: 1px solid #2a3048; color: #c8d0e0;
  padding: .3rem .65rem; border-radius: 2px; cursor: pointer; font-size: .72rem;
}
.small-btn:hover { border-color: #f0a500; color: #f0a500; }
.result-box { background: #0a0e1a; border: 1px solid #2a3048; border-radius: 3px; padding: .75rem; }
.field-grid { display: grid; grid-template-columns: 100px 1fr; gap: .35rem .75rem; font-size: .8rem; }
.label { color: #8892a4; }
.error-box { color: #dc322f; font-size: .8rem; }
</style>
