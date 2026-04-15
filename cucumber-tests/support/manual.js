// ============================================================
//  support/manual.js
//  Interactive terminal prompts for manual testing mode.
//  Used when worldParameters.mode === 'manual'
// ============================================================
import readline from 'readline'
import chalk    from 'chalk'

// Print a clearly formatted manual action prompt
export function printAction(action) {
  console.log('\n' + chalk.bgYellow.black(' ACTION ') + ' ' + chalk.yellow(action))
}

// Print what the QA should verify
export function printVerify(verify) {
  console.log(chalk.bgCyan.black(' VERIFY ') + ' ' + chalk.cyan(verify))
}

// Print a pending/todo notice
export function printPending(stepText) {
  console.log(chalk.bgGray.white(' PENDING ') + ' ' + chalk.gray(`Step not yet automated: ${stepText}`))
}

// Ask the QA analyst for a pass/fail/skip result
// Returns: 'pass' | 'fail' | 'skip'
export async function askResult(stepText) {
  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(
      chalk.white('  Result? ') +
      chalk.green('p = pass') + '  ' +
      chalk.red('f = fail') + '  ' +
      chalk.gray('s = skip') + '  → ',
      answer => {
        rl.close()
        const a = answer.trim().toLowerCase()
        if (a === 'f' || a === 'fail')  return resolve('fail')
        if (a === 's' || a === 'skip')  return resolve('skip')
        return resolve('pass')
      }
    )
  })
}

// Ask for a failure note when QA marks a step as failed
export async function askFailureNote() {
  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(
      chalk.red('  Failure note (brief description): '),
      answer => {
        rl.close()
        resolve(answer.trim() || 'Manual test failed — no note provided.')
      }
    )
  })
}

// Main helper: wrap a step for manual/automated dual mode
// Usage inside step definitions:
//
//   await this.step({
//     action:  'Click New Order button',
//     verify:  'Order form opens',
//     auto: async () => {
//       await this.page.click('#new-order-btn')
//       await this.page.waitForSelector('#order-form')
//     }
//   })
//
export async function runStep(world, { action, verify, auto }) {
  const isManual = world.isManual

  if (isManual) {
    printAction(action)
    if (verify) printVerify(verify)

    const result = await askResult(action)

    if (result === 'fail') {
      const note = await askFailureNote()
      throw new Error(`Manual test failed: ${note}`)
    }

    if (result === 'skip') {
      return 'skipped'
    }

    return 'passed'
  }

  // Automated mode
  if (typeof auto === 'function') {
    await auto()
    return 'passed'
  }

  // No automation implemented yet — mark as pending
  printPending(action)
  return 'pending'
}
