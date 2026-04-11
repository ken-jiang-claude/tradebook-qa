// cucumber-js configuration
// Named exports = profiles; cucumber reads them by profile name.
// "default" is the fallback profile when no --profile flag is given.

const stepFiles = [
  'support/world.js',
  'support/hooks.js',
  'step_definitions/shared/common_steps.js',
  'step_definitions/shared/missing_steps.js',
  'step_definitions/lifecycle/order_steps.js',
  'step_definitions/lifecycle/fill_steps.js',
  'step_definitions/lifecycle/position_steps.js',
  'step_definitions/lifecycle/settlement_steps.js',
]

const fmt = [
  'progress-bar',
  'json:reports/report.json',
  'html:reports/report.html',
]

export const default_ = {
  paths:        ['features/**/*.feature'],
  import:       stepFiles,
  format:       fmt,
  publishQuiet: true,
}

// cucumber requires the profile to be a named export matching the profile name
// "default" is a reserved JS keyword so we use the workaround below
export { default_ as default }

export const manual = {
  paths:           ['features/**/*.feature'],
  import:          stepFiles,
  format:          fmt,
  worldParameters: { mode: 'manual' },
  publishQuiet:    true,
}

export const smoke = {
  paths:        ['features/**/*.feature'],
  import:       stepFiles,
  tags:         '@smoke',
  format:       fmt,
  publishQuiet: true,
}

export const lifecycle = {
  paths:        ['features/lifecycle/**/*.feature'],
  import:       stepFiles,
  format:       fmt,
  publishQuiet: true,
}

export const environment = {
  paths:        ['features/environment/**/*.feature'],
  import:       stepFiles,
  format:       fmt,
  publishQuiet: true,
}
