// scripts/generate-report.js
// Merges lifecycle + edge case JSON reports into one rich HTML living-docs report.
// Run: node scripts/generate-report.js

import reporter from 'cucumber-html-reporter'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const lifecycleJson = resolve(__dirname, '../reports/report.json')
const edgeJson      = resolve(__dirname, '../reports/edge-report.json')
const mergedJson    = resolve(__dirname, '../reports/merged-report.json')

// Merge whichever JSON files exist
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

const options = {
  theme:                  'bootstrap',
  jsonFile:               mergedJson,
  output:                 resolve(__dirname, '../reports/report.html'),
  reportSuiteAsScenarios: true,
  scenarioTimestamp:      true,
  launchReport:           false,
  ignoreBadJsonData:      true,
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
console.log('Report generated → reports/report.html')
