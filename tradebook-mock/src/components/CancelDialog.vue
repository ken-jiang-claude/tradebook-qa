<template>
  <teleport to="body">
    <div v-if="store.ui.cancelDialog" class="modal-overlay" @click.self="close">
      <div class="modal" data-testid="cancel-confirm-dialog">
        <div class="modal-header">
          <span>CANCEL ORDER — {{ store.ui.cancelDialog }}</span>
          <button class="close-btn" @click="close">✕</button>
        </div>

        <p class="confirm-text">Are you sure you want to cancel this order?</p>

        <div v-if="errorMsg" class="error-box">
          <span data-testid="cancel-error">{{ errorMsg }}</span>
          <span data-testid="reject-reason">{{ errorMsg }}</span>
        </div>

        <div class="btn-row">
          <button class="btn-primary" data-testid="cancel-confirm-btn" @click="doCancel">
            CONFIRM CANCEL
          </button>
          <button class="btn-secondary" @click="close">DISMISS</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { store } from '../store/useStore.js'
import { cancelOrder } from '../composables/useOrderMachine.js'

const errorMsg = ref('')

watch(() => store.ui.cancelDialog, () => { errorMsg.value = '' })

function doCancel() {
  errorMsg.value = ''
  const result = cancelOrder(store.ui.cancelDialog)
  if (!result.ok) { errorMsg.value = result.error; return }
  close()
}

function close() { store.ui.cancelDialog = null; errorMsg.value = '' }
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.modal { background: #111827; border: 1px solid #2a3048; border-radius: 4px; padding: 1.25rem; width: 340px; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; margin-bottom: 1rem; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.confirm-text { font-size: .85rem; color: #c8d0e0; margin-bottom: 1rem; }
.error-box {
  background: rgba(220,50,47,.12); border-left: 3px solid #dc322f;
  color: #dc322f; padding: .4rem .6rem; font-size: .78rem; margin-bottom: .75rem; border-radius: 2px;
}
.btn-row { display: flex; gap: .6rem; }
.btn-primary {
  flex: 1; background: #dc322f; color: #fff; border: none;
  padding: .5rem; font-weight: 700; letter-spacing: .06em; border-radius: 3px; cursor: pointer;
}
.btn-primary:hover { background: #e84040; }
.btn-secondary {
  flex: 1; background: transparent; color: #8892a4; border: 1px solid #2a3048;
  padding: .5rem; border-radius: 3px; cursor: pointer;
}
.btn-secondary:hover { border-color: #8892a4; color: #c8d0e0; }
</style>
