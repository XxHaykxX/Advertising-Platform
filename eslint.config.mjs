import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // Two React-Compiler-era rules that fire on code written long before the
      // linter existed here: 37 sites call setState inside an effect, 5 read a
      // ref during render. Neither is a live defect — they are warnings about
      // what the compiler will not be able to memoize later. Kept as `warn` so
      // `npm run lint` can be a gate for new code today; clearing the backlog
      // is its own refactor and has to be done component by component.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
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
