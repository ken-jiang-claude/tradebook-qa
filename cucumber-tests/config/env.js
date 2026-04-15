// ============================================================
//  config/env.js — centralised environment config
//  Reads from .env file. All step definitions import from here.
// ============================================================
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

export const ENV = {
  // Application
  baseUrl:      process.env.TB_BASE_URL      || 'http://localhost:4000',
  environment:  process.env.TB_ENV           || 'alpha',
  username:     process.env.TB_USERNAME      || 'qa_user',
  password:     process.env.TB_PASSWORD      || 'qa_password',

  // Test data
  testAccount:  process.env.TB_TEST_ACCOUNT  || 'QA_TEST_ACCOUNT',
  symbol:       process.env.TB_TEST_SYMBOL   || 'AAPL',
  symbol2:      process.env.TB_TEST_SYMBOL_2 || 'MSFT',
  symbol3:      process.env.TB_TEST_SYMBOL_3 || 'TSLA',

  // Playwright
  headless:     process.env.HEADLESS !== 'false',
  browser:      process.env.BROWSER          || 'chromium',
  timeout:      parseInt(process.env.DEFAULT_TIMEOUT || '20000'),
  slowMo:       parseInt(process.env.SLOW_MO        || '0'),

  // Exchange simulator
  simBaseUrl:   process.env.SIM_BASE_URL     || 'http://localhost:9090',
  simApiKey:    process.env.SIM_API_KEY      || '',

  // Report
  reportTitle:  process.env.REPORT_TITLE     || 'TradeBook QA Test Report',
}

export default ENV
