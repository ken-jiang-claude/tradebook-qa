// ============================================================
//  support/hooks.js
//  Before / After hooks — browser lifecycle and failure capture
// ============================================================
import { Before, After, AfterStep, BeforeAll, AfterAll, Status, setDefaultTimeout } from '@cucumber/cucumber'

// Increase step timeout to 30s so Playwright operations don't get killed
// by Cucumber's default 5s timeout before they complete
setDefaultTimeout(30_000)
import { mkdir } from 'fs/promises'
import chalk     from 'chalk'

// Ensure screenshots directory exists
BeforeAll(async function () {
  await mkdir('reports/screenshots', { recursive: true })
})

// ── Before each scenario ─────────────────────────────────────
Before(async function (scenario) {
  const name = scenario.pickle.name
  const tags = scenario.pickle.tags.map(t => t.name).join(' ')

  if (this.isManual) {
    console.log('\n' + chalk.bgMagenta.white(' SCENARIO ') + ' ' + chalk.white(name))
    if (tags) console.log(chalk.blue('  Tags: ' + tags))
    console.log(chalk.gray('  Mode: MANUAL — follow the prompts for each step\n'))
    return
  }

  // Automated: launch browser
  await this.launchBrowser()
})

// ── After each step: capture screenshot on failure ───────────
AfterStep(async function (step) {
  if (this.isManual) return
  if (step.result?.status === Status.FAILED) {
    const stepText = step.pickleStep?.text || 'unknown-step'
    const safeName = stepText.replace(/[^a-z0-9]/gi, '_').slice(0, 40)
    const path     = await this.screenshot(`FAIL_${safeName}`)
    if (path) {
      console.log(chalk.red(`  Screenshot saved: ${path}`))
    }
  }
})

// ── After each scenario ──────────────────────────────────────
After(async function (scenario) {
  const status = scenario.result?.status
  const name   = scenario.pickle.name

  if (this.isManual) {
    const icon = status === Status.PASSED ? chalk.green('PASS') : chalk.red('FAIL')
    console.log(`\n  [${icon}] ${name}\n`)
    return
  }

  // On failure: take a final full-page screenshot
  if (status === Status.FAILED) {
    const safeName = name.replace(/[^a-z0-9]/gi, '_').slice(0, 50)
    await this.screenshot(`SCENARIO_FAIL_${safeName}`)
  }

  await this.closeBrowser()
})

AfterAll(async function () {
  console.log(chalk.yellow('\n  Report saved to: reports/report.html\n'))
})
