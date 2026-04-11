<template>
  <teleport to="body">
    <div
      v-if="store.ui.contextMenu"
      class="ctx-overlay"
      @click="close"
      @contextmenu.prevent="close"
    >
      <ul
        class="ctx-menu"
        :style="{ top: store.ui.contextMenu.y + 'px', left: store.ui.contextMenu.x + 'px' }"
        @click.stop
      >
        <li
          data-testid="context-menu-modify"
          :class="{ disabled: isTerminal }"
          @click="onModify"
        >Modify Order</li>
        <li
          data-testid="context-menu-cancel"
          :class="{ disabled: isTerminal }"
          @click="onCancel"
        >Cancel Order</li>
        <li data-testid="context-menu-history" @click="onHistory">Order History</li>
      </ul>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'
import { store } from '../store/useStore.js'

const TERMINAL = ['Filled', 'Canceled', 'Partially Filled and Canceled', 'Rejected']

const currentOrder = computed(() => {
  if (!store.ui.contextMenu) return null
  return store.orders.find(o => o.orderId === store.ui.contextMenu.orderId)
})

const isTerminal = computed(() =>
  currentOrder.value ? TERMINAL.includes(currentOrder.value.status) : false
)

function close() { store.ui.contextMenu = null }

function onModify() {
  if (isTerminal.value) return
  store.ui.modifyForm = store.ui.contextMenu.orderId
  close()
}
function onCancel() {
  if (isTerminal.value) return
  store.ui.cancelDialog = store.ui.contextMenu.orderId
  close()
}
function onHistory() {
  store.ui.historyPanel = store.ui.contextMenu.orderId
  close()
}
</script>

<style scoped>
.ctx-overlay {
  position: fixed; inset: 0; z-index: 900;
}
.ctx-menu {
  position: fixed;
  background: #1a1f2e;
  border: 1px solid #2a3048;
  border-radius: 3px;
  list-style: none;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0,0,0,.5);
  z-index: 901;
}
.ctx-menu li {
  padding: .5rem .9rem;
  cursor: pointer;
  font-size: .8rem;
  color: #c8d0e0;
}
.ctx-menu li:hover:not(.disabled) { background: #2a3048; color: #f0a500; }
.ctx-menu li.disabled { color: #4a5568; cursor: not-allowed; }
</style>
