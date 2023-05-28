import type { JestConfigWithTsJest } from 'ts-jest/dist/types'

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  displayName: 'e2e',
  testMatch: ['**/e2e/**/*.test.ts'],
  globalSetup: './tests/e2e/__global__/setup.ts',
}

export default config
