<template>
  <teleport to="body">
    <div v-if="store.ui.modifyForm" class="modal-overlay" @click.self="close">
      <div class="modal" data-testid="modify-form">
        <div class="modal-header">
          <span>MODIFY ORDER — {{ store.ui.modifyForm }}</span>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <div v-if="confirmed" class="confirm-box" data-testid="modify-confirm">
          <div class="confirm-title">Order Modified</div>
          <button class="btn-primary" style="margin-top:.75rem" @click="close">CLOSE</button>
        </div>

        <form v-else @submit.prevent="doModify">
          <div class="field">
            <label>New Quantity</label>
            <input v-model="qty" data-testid="modify-qty" type="number" min="1" />
          </div>
          <div class="field">
            <label>New Price</label>
            <input v-model="price" data-testid="modify-price" type="number" step="0.01" />
          </div>

          <div v-if="errorMsg" class="error-box">
            <span data-testid="modify-error">{{ errorMsg }}</span>
            <span data-testid="reject-reason">{{ errorMsg }}</span>
          </div>

          <button type="submit" class="btn-primary" data-testid="modify-submit">SUBMIT MODIFY</button>
        </form>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { store } from '../store/useStore.js'
import { modifyOrder } from '../composables/useOrderMachine.js'

const qty       = ref('')
const price     = ref('')
const errorMsg  = ref('')
const confirmed = ref(false)

watch(() => store.ui.modifyForm, (orderId) => {
  if (!orderId) return
  const order = store.orders.find(o => o.orderId === orderId)
  if (order) { qty.value = order.qty; price.value = order.price }
  errorMsg.value  = ''
  confirmed.value = false
})

function doModify() {
  errorMsg.value = ''
  const result = modifyOrder(store.ui.modifyForm, { qty: qty.value, price: price.value })
  if (!result.ok) { errorMsg.value = result.error; return }
  confirmed.value = true
}

function close() { store.ui.modifyForm = null; confirmed.value = false; errorMsg.value = '' }
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.modal { background: #111827; border: 1px solid #2a3048; border-radius: 4px; padding: 1.25rem; width: 320px; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; margin-bottom: 1rem; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.field { margin-bottom: .75rem; }
.field label { display: block; font-size: .72rem; color: #8892a4; margin-bottom: .25rem; }
.field input {
  width: 100%; background: #0a0e1a; border: 1px solid #2a3048;
  color: #c8d0e0; padding: .4rem .6rem; border-radius: 3px; outline: none;
}
.field input:focus { border-color: #f0a500; }
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
