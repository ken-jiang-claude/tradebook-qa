<template>
  <teleport to="body">
    <div v-if="store.ui.orderForm" class="modal-overlay" @click.self="close">
      <div class="modal" data-testid="order-form">
        <div class="modal-header">
          <span>NEW ORDER</span>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <!-- Confirmation shown after successful submit -->
        <div v-if="confirmed" class="confirm-box" data-testid="order-confirm">
          <div class="confirm-title">Order Accepted</div>
          <div>Order ID: <strong data-testid="order-id">{{ confirmedId }}</strong></div>
          <button class="btn-primary" style="margin-top:.8rem" @click="close">CLOSE</button>
        </div>

        <!-- Entry form -->
        <form v-else @submit.prevent="doSubmit">
          <div class="field">
            <label>Side</label>
            <select v-model="form.side" data-testid="order-side">
              <option>Buy</option>
              <option>Sell</option>
            </select>
          </div>
          <div class="field">
            <label>Symbol</label>
            <input v-model="form.symbol" data-testid="order-symbol" placeholder="AAPL" />
          </div>
          <div class="field">
            <label>Quantity</label>
            <input v-model="form.qty" data-testid="order-qty" type="number" placeholder="100" />
          </div>
          <div class="field">
            <label>Price</label>
            <input v-model="form.price" data-testid="order-price" type="number" placeholder="150.00" />
          </div>
          <div class="field">
            <label>Order Type</label>
            <select v-model="form.orderType" data-testid="order-type">
              <option>Limit</option>
              <option>Market</option>
            </select>
          </div>
          <div class="field">
            <label>Account</label>
            <input v-model="form.account" data-testid="order-account" />
          </div>

          <div v-if="errorMsg" class="error-box" data-testid="order-error">{{ errorMsg }}</div>

          <button type="submit" class="btn-primary" data-testid="order-submit">SUBMIT ORDER</button>
        </form>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { store } from '../store/useStore.js'
import { submitOrder } from '../composables/useOrderMachine.js'

const confirmed  = ref(false)
const confirmedId = ref('')
const errorMsg   = ref('')

const form = ref({
  side: 'Buy', symbol: '', qty: '', price: '', orderType: 'Limit', account: 'QA_TEST_ACCOUNT',
})

watch(() => store.ui.orderForm, (v) => {
  if (v) { confirmed.value = false; errorMsg.value = ''; resetForm() }
})

function resetForm() {
  form.value = { side: 'Buy', symbol: '', qty: '', price: '', orderType: 'Limit', account: 'QA_TEST_ACCOUNT' }
}

function doSubmit() {
  errorMsg.value = ''
  const result = submitOrder(form.value)
  if (!result.ok) {
    errorMsg.value = result.error
    return
  }
  confirmed.value  = true
  confirmedId.value = result.orderId
}

function close() {
  store.ui.orderForm = false
  confirmed.value = false
  errorMsg.value  = ''
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.modal {
  background: #111827; border: 1px solid #2a3048; border-radius: 4px;
  padding: 1.25rem; width: 360px;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  font-size: .75rem; letter-spacing: .08em; color: #f0a500;
  margin-bottom: 1rem; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.field { margin-bottom: .75rem; }
.field label { display: block; font-size: .72rem; color: #8892a4; margin-bottom: .25rem; }
.field input, .field select {
  width: 100%; background: #0a0e1a; border: 1px solid #2a3048;
  color: #c8d0e0; padding: .4rem .6rem; border-radius: 3px; outline: none;
}
.field input:focus, .field select:focus { border-color: #f0a500; }
.error-box {
  background: rgba(220,50,47,.12); border-left: 3px solid #dc322f;
  color: #dc322f; padding: .4rem .6rem; font-size: .78rem; margin-bottom: .75rem; border-radius: 2px;
}
.btn-primary {
  width: 100%; background: #f0a500; color: #000; border: none;
  padding: .55rem; font-weight: 700; letter-spacing: .07em; border-radius: 3px; cursor: pointer;
}
.btn-primary:hover { background: #ffb820; }
.confirm-box { text-align: center; padding: .5rem 0; }
.confirm-title { color: #00c851; font-weight: 700; font-size: 1rem; margin-bottom: .5rem; }
</style>
