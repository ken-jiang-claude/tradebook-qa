<template>
  <div class="blotter-view">
    <!-- Top bar -->
    <header class="topbar">
      <div class="topbar-left">
        <div class="logo">TB</div>
        <div class="app-title">TradeBook</div>
        <div class="env-banner" data-testid="env-banner">ALPHA — NON-PRODUCTION</div>
        <div class="business-date" data-testid="business-date">{{ today }}</div>
        <div data-testid="session-status" data-status="connected" class="session-dot" title="Session Connected">●</div>
        <span data-testid="market-session-hours" style="display:none">09:30–16:00 ET</span>
        <span data-testid="settlement-cycle" style="display:none">T+2</span>
      </div>
      <div class="topbar-center">
        <MarketDataBar />
      </div>
      <div class="topbar-right">
        <button class="tb-btn" data-testid="new-order-btn"          @click="store.ui.orderForm = true">+ NEW ORDER</button>
        <button class="tb-btn" data-testid="settlement-report-btn"  @click="store.ui.settlementPanel = true">SETTLEMENT</button>
        <button class="tb-btn" data-testid="rhub-search-btn"        @click="store.ui.rhubPanel = true">RHUB</button>
        <button class="tb-btn" data-testid="position-btn"           @click="store.ui.positionPanel = true">POSITIONS</button>
        <button class="tb-btn" data-testid="instrument-search-btn"  @click="store.ui.instrumentPanel = true">SEC MASTER</button>
        <button class="tb-btn" data-testid="session-monitor-btn"    @click="store.ui.sessionPanel = true">SESSION</button>
        <button class="tb-btn" data-testid="system-health-btn"      @click="store.ui.healthPanel = true">HEALTH</button>
        <button class="tb-btn" data-testid="account-menu"           @click="store.ui.accountPanel = true">ACCOUNT</button>
        <button class="tb-btn" data-testid="log-viewer-btn"         @click="store.ui.logPanel = true">LOGS</button>
        <button class="tb-btn sim-btn"                             @click="store.ui.simPanel = true">⚡ SIMULATOR</button>
      </div>
    </header>

    <!-- Blotter -->
    <main class="blotter-main">
      <div class="blotter-title">ORDER BLOTTER</div>
      <OrderBlotter />
    </main>

    <!-- All panels and modals -->
    <ContextMenu />
    <OrderForm />
    <ModifyForm />
    <CancelDialog />
    <OrderHistoryPanel />
    <SettlementPanel />
    <RhubPanel />
    <PositionPanel />
    <SessionMonitorPanel />
    <HealthPanel />
    <AccountPanel />
    <InstrumentSearch />
    <LogViewer />
    <OverfillAlert />
    <SimulatorPanel />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { store } from '../store/useStore.js'
import { installSimulator } from '../composables/useSimulator.js'

import MarketDataBar       from '../components/MarketDataBar.vue'
import OrderBlotter        from '../components/OrderBlotter.vue'
import ContextMenu         from '../components/ContextMenu.vue'
import OrderForm           from '../components/OrderForm.vue'
import ModifyForm          from '../components/ModifyForm.vue'
import CancelDialog        from '../components/CancelDialog.vue'
import OrderHistoryPanel   from '../components/OrderHistoryPanel.vue'
import SettlementPanel     from '../components/SettlementPanel.vue'
import RhubPanel           from '../components/RhubPanel.vue'
import PositionPanel       from '../components/PositionPanel.vue'
import SessionMonitorPanel from '../components/SessionMonitorPanel.vue'
import HealthPanel         from '../components/HealthPanel.vue'
import AccountPanel        from '../components/AccountPanel.vue'
import InstrumentSearch    from '../components/InstrumentSearch.vue'
import LogViewer           from '../components/LogViewer.vue'
import OverfillAlert       from '../components/OverfillAlert.vue'
import SimulatorPanel      from '../components/SimulatorPanel.vue'

const today = new Date().toISOString().split('T')[0]

onMounted(() => {
  installSimulator()
})
</script>

<style scoped>
.blotter-view { display: flex; flex-direction: column; min-height: 100vh; }

.topbar {
  display: flex; align-items: center; gap: .75rem; flex-wrap: wrap;
  background: #0d1120; border-bottom: 1px solid #2a3048;
  padding: .45rem .85rem; position: sticky; top: 0; z-index: 100;
}
.topbar-left  { display: flex; align-items: center; gap: .5rem; flex-shrink: 0; }
.topbar-center { flex: 1; display: flex; align-items: center; }
.topbar-right  { display: flex; align-items: center; gap: .3rem; flex-wrap: wrap; }

.logo {
  background: #f0a500; color: #000; font-weight: 900;
  width: 28px; height: 28px; border-radius: 3px;
  display: flex; align-items: center; justify-content: center; font-size: .85rem;
}
.app-title  { font-weight: 700; color: #f0a500; font-size: .9rem; }
.env-banner {
  font-size: .65rem; color: #f0a500; border: 1px solid #f0a500;
  padding: .1rem .35rem; border-radius: 2px; letter-spacing: .06em;
}
.business-date { font-size: .72rem; color: #8892a4; }
.session-dot   { color: #00c851; font-size: .85rem; title: "Connected"; }

.tb-btn {
  background: #1e2535; border: 1px solid #2a3048; color: #c8d0e0;
  padding: .25rem .6rem; border-radius: 2px; cursor: pointer;
  font-size: .7rem; font-family: inherit; letter-spacing: .04em; white-space: nowrap;
}
.tb-btn:hover { border-color: #f0a500; color: #f0a500; }
.sim-btn { border-color: #f0a500; color: #f0a500; }

.blotter-main { flex: 1; padding: .75rem 1rem; }
.blotter-title {
  font-size: .68rem; letter-spacing: .1em; color: #8892a4;
  font-weight: 700; margin-bottom: .5rem;
}
</style>
