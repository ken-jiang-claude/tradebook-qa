<template>
  <teleport to="body">
    <div v-if="store.ui.accountPanel" class="panel-overlay" @click.self="close">
      <div class="panel" data-testid="account-permissions-panel">
        <div class="panel-header">
          <span>ACCOUNT &amp; ENTITLEMENTS</span>
          <button class="close-btn" @click="close">✕</button>
        </div>
        <div class="panel-body">
          <table class="acct-table">
            <thead><tr><th>Account</th><th>Type</th><th>Place Order</th><th>Modify</th><th>Cancel</th></tr></thead>
            <tbody>
              <tr data-testid="account-row" data-account="QA_TEST_ACCOUNT">
                <td>QA_TEST_ACCOUNT</td>
                <td style="color:#f0a500">NON-PROD</td>
                <td><span data-testid="function-place-order" style="color:#00c851">✓ Enabled</span></td>
                <td style="color:#00c851">✓</td>
                <td style="color:#00c851">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { store } from '../store/useStore.js'
function close() { store.ui.accountPanel = false }
</script>

<style scoped>
.panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.panel { background: #111827; border: 1px solid #2a3048; border-radius: 4px; width: 520px; max-width: 95vw; }
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; border-bottom: 1px solid #2a3048;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.panel-body { padding: .75rem 1rem; }
.acct-table { width: 100%; border-collapse: collapse; font-size: .8rem; }
.acct-table th { color: #8892a4; padding: .3rem .5rem; text-align: left; border-bottom: 1px solid #2a3048; }
.acct-table td { padding: .35rem .5rem; border-bottom: 1px solid #1a1f2e; }
</style>
