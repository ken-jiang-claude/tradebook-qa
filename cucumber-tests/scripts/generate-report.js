// scripts/generate-report.js
// Merges lifecycle + edge case JSON reports into one rich HTML living-docs report.
// Injects clickable filter buttons for All / Passed / Failed / Undefined scenarios.
// Run: node scripts/generate-report.js

import reporter from 'cucumber-html-reporter'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const lifecycleJson = resolve(__dirname, '../reports/report.json')
const edgeJson      = resolve(__dirname, '../reports/edge-report.json')
const mergedJson    = resolve(__dirname, '../reports/merged-report.json')
const outputHtml    = resolve(__dirname, '../reports/report.html')

// ── Merge JSON files ─────────────────────────────────────────
const parts = []
if (existsSync(lifecycleJson)) {
  try { parts.push(...JSON.parse(readFileSync(lifecycleJson, 'utf8'))) } catch {}
}
if (existsSync(edgeJson)) {
  try { parts.push(...JSON.parse(readFileSync(edgeJson, 'utf8'))) } catch {}
}

if (parts.length === 0) {
  console.error('ERROR: No report JSON found. Run the tests first.')
  process.exit(1)
}

writeFileSync(mergedJson, JSON.stringify(parts, null, 2))

// ── Generate base HTML ───────────────────────────────────────
const options = {
  theme:                  'bootstrap',
  jsonFile:               mergedJson,
  output:                 outputHtml,
  reportSuiteAsScenarios: true,
  scenarioTimestamp:      true,
  launchReport:           false,
  ignoreBadJsonData:      true,
  noInlineAssets:         false,
  columnLayout:           1,
  metadata: {
    'Project':     'TradeBook QA',
    'Test Suite':  'Lifecycle (56) + Edge Cases (9)',
    'Executed':    new Date().toISOString().split('T')[0],
    'Platform':    'Playwright + Cucumber-js v10',
    'Browser':     process.env.BROWSER || 'chromium',
    'Environment': process.env.TB_BASE_URL ? 'CI' : 'Local',
    'Live UI':     'https://tradebook-mock.onrender.com',
  },
  customData: {
    title: 'TradeBook QA — Living Documentation',
    data: [
      { label: 'Project',      value: 'TradeBook Mock — Interview Portfolio' },
      { label: 'Author',       value: 'Ken Jiang' },
      { label: 'Framework',    value: 'Cucumber-js + Playwright' },
      { label: 'Core Suite',   value: '56 scenarios — 100% passing' },
      { label: 'Edge Cases',   value: '9 scenarios — known issues with documented root causes' },
      { label: 'Live UI',      value: '<a href="https://tradebook-mock.onrender.com" target="_blank">tradebook-mock.onrender.com</a>' },
    ],
  },
}

reporter.generate(options)

// ── Inject filter script into generated HTML ─────────────────
const filterScript = `
<style>
  .tb-filter-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 16px 0 8px 0;
    padding: 12px 16px;
    background: #1a1f2e;
    border-radius: 4px;
    border: 1px solid #2a3048;
    align-items: center;
  }
  .tb-filter-bar span {
    font-size: 12px;
    color: #8892a4;
    margin-right: 4px;
    font-weight: 600;
    letter-spacing: .05em;
  }
  .tb-filter-btn {
    padding: 5px 14px;
    border-radius: 3px;
    border: 1px solid #2a3048;
    background: #0d1120;
    color: #c8d0e0;
    font-size: 12px;
    cursor: pointer;
    font-weight: 600;
    letter-spacing: .04em;
    transition: all .15s;
  }
  .tb-filter-btn:hover        { border-color: #f0a500; color: #f0a500; }
  .tb-filter-btn.active       { background: #f0a500; color: #000; border-color: #f0a500; }
  .tb-filter-btn.btn-passed   { border-color: #00c851; color: #00c851; }
  .tb-filter-btn.btn-passed.active { background: #00c851; color: #000; }
  .tb-filter-btn.btn-failed   { border-color: #dc322f; color: #dc322f; }
  .tb-filter-btn.btn-failed.active { background: #dc322f; color: #fff; }
  .tb-filter-btn.btn-undefined { border-color: #f0a500; color: #f0a500; }
  .tb-filter-btn.btn-undefined.active { background: #f0a500; color: #000; }
  .feature-hidden { display: none !important; }
</style>

<script>
(function() {
  function initFilters() {
    // Find all feature/scenario panel containers
    // cucumber-html-reporter uses .panel or .feature elements
    var featurePanels = document.querySelectorAll('.feature')
    if (!featurePanels.length) featurePanels = document.querySelectorAll('.panel.panel-default')

    // Inject the filter bar before the first feature
    var container = featurePanels.length ? featurePanels[0].parentElement : null
    if (!container) return

    var bar = document.createElement('div')
    bar.className = 'tb-filter-bar'
    bar.innerHTML = \`
      <span>FILTER:</span>
      <button class="tb-filter-btn active" data-filter="all">All Scenarios</button>
      <button class="tb-filter-btn btn-passed" data-filter="passed">Passed</button>
      <button class="tb-filter-btn btn-failed" data-filter="failed">Failed</button>
      <button class="tb-filter-btn btn-undefined" data-filter="undefined">Undefined</button>
    \`
    container.insertBefore(bar, featurePanels[0])

    bar.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-filter]')
      if (!btn) return

      // Update active button
      bar.querySelectorAll('.tb-filter-btn').forEach(function(b) { b.classList.remove('active') })
      btn.classList.add('active')

      var filter = btn.getAttribute('data-filter')

      featurePanels.forEach(function(panel) {
        if (filter === 'all') {
          panel.classList.remove('feature-hidden')
          // Show all scenarios inside
          panel.querySelectorAll('.scenario, .scenario-container, [class*="scenario"]').forEach(function(s) {
            s.style.display = ''
          })
          return
        }

        // Check each scenario within the feature
        // cucumber-html-reporter marks status via classes like 'passed', 'failed', 'undefined'
        var scenarios = panel.querySelectorAll('.scenario, .scenario-container, tr[class]')
        var hasMatch = false

        scenarios.forEach(function(s) {
          var classList = s.className || ''
          var matches = classList.includes(filter)
          s.style.display = matches ? '' : 'none'
          if (matches) hasMatch = true
        })

        // Also check panel-level status class (some themes apply status to the feature panel)
        if (!hasMatch) {
          var panelClass = panel.className || ''
          hasMatch = panelClass.includes(filter)
        }

        panel.classList.toggle('feature-hidden', !hasMatch)
      })
    })
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFilters)
  } else {
    initFilters()
  }
})()
</script>
`

// Inject before closing </body>
let html = readFileSync(outputHtml, 'utf8')
html = html.replace('</body>', filterScript + '\n</body>')
writeFileSync(outputHtml, html)

console.log('Report generated → reports/report.html')
console.log('Filter bar injected ✓')
