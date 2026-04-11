// ============================================================
//  support/hooks.js
//  Before / After hooks — browser lifecycle and failure capture
// ============================================================
import { Before, After, AfterStep, BeforeAll, AfterAll, Status, setDefaultTimeout } from '@cucumber/cucumber'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import chalk     from 'chalk'

// Increase step timeout to 30s so Playwright operations don't get killed
// by Cucumber's default 5s timeout before they complete
setDefaultTimeout(30_000)

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

// ── After each step: capture + embed screenshot on failure ───
AfterStep(async function (step) {
  if (this.isManual) return
  if (step.result?.status === Status.FAILED) {
    const stepText = step.pickleStep?.text || 'unknown-step'
    const safeName = stepText.replace(/[^a-z0-9]/gi, '_').slice(0, 40)
    const path     = await this.screenshot(`FAIL_${safeName}`)
    if (path && existsSync(path)) {
      console.log(chalk.red(`  Screenshot saved: ${path}`))
      // Embed screenshot into Cucumber report
      try {
        const img = await readFile(path)
        await this.attach(img, 'image/png')
      } catch {
        // attach failed — don't block the run
      }
    }
    // Embed error message into report
    if (step.result?.message) {
      await this.attach(`ERROR: ${step.result.message}`, 'text/plain')
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

  // On failure: take final screenshot and embed it
  if (status === Status.FAILED) {
    const safeName = name.replace(/[^a-z0-9]/gi, '_').slice(0, 50)
    const path = await this.screenshot(`SCENARIO_FAIL_${safeName}`)
    if (path && existsSync(path)) {
      try {
        const img = await readFile(path)
        await this.attach(img, 'image/png')
        await this.attach(
          `Scenario failed: ${name}\nSee screenshot above for UI state at time of failure.`,
          'text/plain'
        )
      } catch {
        // attach failed — don't block the run
      }
    }
  }

  await this.closeBrowser()
})

AfterAll(async function () {
  console.log(chalk.yellow('\n  Report saved to: reports/report.html\n'))
})
