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
    background: #f5f5f5;
    border-radius: 4px;
    border: 1px solid #ddd;
    align-items: center;
  }
  .tb-filter-bar span.tb-filter-label {
    font-size: 12px;
    color: #555;
    margin-right: 4px;
    font-weight: 700;
    letter-spacing: .05em;
  }
  .tb-filter-btn {
    padding: 5px 14px;
    border-radius: 3px;
    border: 1px solid #aaa;
    background: #fff;
    color: #333;
    font-size: 12px;
    cursor: pointer;
    font-weight: 600;
    letter-spacing: .04em;
    transition: all .15s;
  }
  .tb-filter-btn:hover                  { border-color: #333; background: #eee; }
  .tb-filter-btn.active                 { background: #555; color: #fff; border-color: #333; }
  .tb-filter-btn.btn-passed:hover       { border-color: #3c763d; }
  .tb-filter-btn.btn-passed.active      { background: #3c763d; color: #fff; border-color: #3c763d; }
  .tb-filter-btn.btn-failed:hover       { border-color: #a94442; }
  .tb-filter-btn.btn-failed.active      { background: #a94442; color: #fff; border-color: #a94442; }
  .tb-filter-btn.btn-undefined:hover    { border-color: #8a6d3b; }
  .tb-filter-btn.btn-undefined.active   { background: #8a6d3b; color: #fff; border-color: #8a6d3b; }
  .tb-scenario-hidden                   { display: none !important; }
  .tb-feature-hidden                    { display: none !important; }
  .tb-undefined-hint {
    font-size: 11px;
    color: #8a6d3b;
    margin-left: 8px;
    font-style: normal;
    align-self: center;
    border-left: 2px solid #d6b86b;
    padding-left: 8px;
    line-height: 1.4;
  }
</style>

<script>
(function() {

  function getScenarioStatus(scenarioPanel) {
    // Look at the label-container inside the direct panel-heading of this scenario panel
    var heading = scenarioPanel.children[0] // .panel-heading
    if (!heading) return 'unknown'
    var lc = heading.querySelector('.label-container')
    if (!lc) return 'unknown'
    if (lc.querySelector('.label-danger'))  return 'failed'
    if (lc.querySelector('.label-success')) return 'passed'
    if (lc.querySelector('.label-warning')) return 'undefined'
    return 'unknown'
  }

  function initFilters() {
    // Feature wrappers: div.feature-passed or div.feature-failed
    // Each is inside a div.row
    var featureWrappers = Array.from(document.querySelectorAll('div.feature-passed, div.feature-failed'))
    if (!featureWrappers.length) return

    // Scenario panels sit at:
    // feature-wrapper > div.col > div.panel(feature) > div.panel-collapse > div.panel-body > div.panel(scenario)
    var allScenarioPanels = []
    featureWrappers.forEach(function(fw) {
      // Use querySelectorAll without > so it works regardless of nesting depth
      var featurePanelBody = fw.querySelector('.panel-collapse .panel-body')
      if (!featurePanelBody) return
      var scenarios = featurePanelBody.querySelectorAll(':scope > .panel.panel-default')
      scenarios.forEach(function(sp) {
        sp._featureWrapper = fw
        sp._status = getScenarioStatus(sp)
        allScenarioPanels.push(sp)
      })
    })

    if (!allScenarioPanels.length) return

    // Count per status
    var counts = { all: allScenarioPanels.length, passed: 0, failed: 0, undefined: 0 }
    allScenarioPanels.forEach(function(sp) {
      if (counts[sp._status] !== undefined) counts[sp._status]++
    })

    // Inject filter bar before the first feature wrapper's parent row
    var firstRow = featureWrappers[0].parentElement
    var container = firstRow ? firstRow.parentElement : featureWrappers[0].parentElement

    var bar = document.createElement('div')
    bar.className = 'tb-filter-bar'
    bar.innerHTML =
      '<span class="tb-filter-label">FILTER:</span>' +
      '<button class="tb-filter-btn active"       data-filter="all">All Scenarios (' + counts.all + ')</button>' +
      '<button class="tb-filter-btn btn-passed"    data-filter="passed">&#10003; Passed (' + counts.passed + ')</button>' +
      '<button class="tb-filter-btn btn-failed"    data-filter="failed">&#10007; Failed (' + counts.failed + ')</button>' +
      '<button class="tb-filter-btn btn-undefined" data-filter="undefined" title="Undefined: step definitions exist but the scenario reached a step that threw a deliberate [KNOWN ISSUE] error — these are intentionally failing edge cases that document what the mock does not support.">? Undefined (' + counts.undefined + ')</button>' +
      '<span class="tb-undefined-hint">&#9432; <em>Undefined</em> = known-issue edge cases — steps throw intentional errors to document unsupported behaviour</span>'

    // Insert before the first row (or feature wrapper if no row)
    var insertBefore = firstRow || featureWrappers[0]
    container.insertBefore(bar, insertBefore)

    bar.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-filter]')
      if (!btn) return

      bar.querySelectorAll('.tb-filter-btn').forEach(function(b) { b.classList.remove('active') })
      btn.classList.add('active')

      var filter = btn.getAttribute('data-filter')

      // Show/hide each scenario panel
      allScenarioPanels.forEach(function(sp) {
        var show = (filter === 'all') || (sp._status === filter)
        sp.classList.toggle('tb-scenario-hidden', !show)
      })

      // Show/hide each feature row based on whether its wrapper has visible scenarios
      featureWrappers.forEach(function(fw) {
        var hasVisible = allScenarioPanels.some(function(sp) {
          return sp._featureWrapper === fw && !sp.classList.contains('tb-scenario-hidden')
        })
        // Hide the parent .row div so the gap disappears too
        var row = fw.parentElement
        if (row && row.classList.contains('row')) {
          row.classList.toggle('tb-feature-hidden', !hasVisible)
        } else {
          fw.classList.toggle('tb-feature-hidden', !hasVisible)
        }
      })
    })
  }

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
