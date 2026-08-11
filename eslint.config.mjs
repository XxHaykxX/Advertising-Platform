import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // The two React-Compiler-era rules that used to carry a 40-odd site
      // backlog. Cleared on 2026-08-12: the derived-state cases now adjust
      // during render, the ref-during-render ones seed their counters from a
      // plain index, and what genuinely has to be an effect (browser APIs,
      // focus after commit, object URLs) carries a one-line reason at the
      // exact statement. `error`, not `warn`, so the next one is caught while
      // it is being written rather than added to a backlog.
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/refs': 'error',
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next.
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Generated, vendored or throwaway trees that are not ours to lint.
    'node_modules/**',
    'public/**',
    'test-results/**',
    'playwright-report/**',
    '.playwright-mcp/**',
    'filmustage-ref/**',
    'prisma/migrations/**',
  ]),
])

export default eslintConfig
