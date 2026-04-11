// scripts/generate-report.js
// Reads reports/report.json and generates a rich HTML living-docs report.
// Run: node scripts/generate-report.js

import reporter from 'cucumber-html-reporter'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const jsonReport = resolve(__dirname, '../reports/report.json')

if (!existsSync(jsonReport)) {
  console.error('ERROR: reports/report.json not found. Run the tests first.')
  process.exit(1)
}

const options = {
  theme:            'bootstrap',
  jsonFile:         jsonReport,
  output:           resolve(__dirname, '../reports/report.html'),
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport:     false,
  ignoreBadJsonData: true,
  metadata: {
    'Project':      'TradeBook QA',
    'Test Suite':   'BDD Lifecycle + Smoke',
    'Executed':     new Date().toISOString().split('T')[0],
    'Platform':     'Playwright + Cucumber-js v10',
    'Browser':      process.env.BROWSER || 'chromium',
    'Environment':  process.env.TB_BASE_URL ? 'CI' : 'Local',
    'Live UI':      'https://tradebook-mock.onrender.com',
  },
  customData: {
    title: 'TradeBook QA — Living Documentation',
    data: [
      { label: 'Project',    value: 'TradeBook Mock — Interview Portfolio' },
      { label: 'Author',     value: 'Taikary Jiang' },
      { label: 'Framework',  value: 'Cucumber-js + Playwright' },
      { label: 'Live UI',    value: '<a href="https://tradebook-mock.onrender.com" target="_blank">tradebook-mock.onrender.com</a>' },
    ],
  },
}

reporter.generate(options)
console.log('Report generated → reports/report.html')
