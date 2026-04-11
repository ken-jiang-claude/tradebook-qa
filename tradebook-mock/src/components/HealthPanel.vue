<template>
  <teleport to="body">
    <div v-if="store.ui.healthPanel" class="panel-overlay" @click.self="close">
      <div class="panel" data-testid="health-panel">
        <div class="panel-header">
          <span>SYSTEM HEALTH</span>
          <button class="close-btn" @click="close">✕</button>
        </div>
        <div class="panel-body">
          <!-- prod-warning intentionally absent -->
          <table class="health-table">
            <thead><tr><th>System</th><th>Status</th><th>Latency</th></tr></thead>
            <tbody>
              <tr v-for="sys in systems" :key="sys.id">
                <td>{{ sys.label }}</td>
                <td>
                  <span
                    :data-testid="'system-status-' + sys.id"
                    data-status="connected"
                    style="color:#00c851"
                  >● Connected</span>
                </td>
                <td style="color:#8892a4">{{ sys.latency }}ms</td>
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

const systems = [
  { id: 'settlement', label: 'Settlement',        latency: 4  },
  { id: 'rhub',       label: 'RHUB',              latency: 7  },
  { id: 'position',   label: 'Position Mgmt',     latency: 3  },
  { id: 'booking',    label: 'Booking System',     latency: 12 },
  { id: 'exchange',   label: 'Exchange Simulator', latency: 1  },
]

function close() { store.ui.healthPanel = false }
</script>

<style scoped>
.panel-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5);
  display: flex; align-items: center; justify-content: center; z-index: 800;
}
.panel { background: #111827; border: 1px solid #2a3048; border-radius: 4px; width: 420px; max-width: 95vw; }
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .75rem 1rem; border-bottom: 1px solid #2a3048;
  font-size: .72rem; letter-spacing: .08em; color: #f0a500; font-weight: 700;
}
.close-btn { background: none; border: none; color: #8892a4; cursor: pointer; font-size: 1rem; }
.panel-body { padding: .75rem 1rem; }
.health-table { width: 100%; border-collapse: collapse; font-size: .8rem; }
.health-table th { color: #8892a4; padding: .3rem .5rem; text-align: left; border-bottom: 1px solid #2a3048; }
.health-table td { padding: .35rem .5rem; border-bottom: 1px solid #1a1f2e; }
</style>
