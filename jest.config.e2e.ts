import type { JestConfigWithTsJest } from 'ts-jest/dist/types'

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  displayName: 'e2e',
  testMatch: ['**/e2e/**/*.test.ts'],
  testTimeout: 5 * 60 * 1000,
}

export default config
