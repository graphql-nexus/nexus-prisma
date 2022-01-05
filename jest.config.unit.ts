import type { InitialOptionsTsJest } from 'ts-jest/dist/types'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  displayName: 'unit',
  testMatch: [
    '**/unit/**/*.test.ts',
    '**/lib/**/*.test.ts',
    '**/integration/**/*.test.ts',
    '**/checks/**/*.test.ts',
  ],
}

export default config
