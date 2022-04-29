import type { InitialOptionsTsJest } from 'ts-jest/dist/types'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  displayName: 'e2e',
  testMatch: ['**/e2e/**/*.test.ts'],
  setupFiles: ['dotenv/config']
}

export default config
