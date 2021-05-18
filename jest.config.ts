import type { InitialOptionsTsJest } from 'ts-jest/dist/types'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  testPathIgnorePatterns: process.env.CI ? [] : ['.*e2e.*'],
  globals: {
    'ts-jest': {
      diagnostics: Boolean(process.env.CI) ? { ignoreCodes: [7006, 7031] } : false,
      babelConfig: false,
      tsconfig: '<rootDir>/tests/tsconfig.json',
    },
  },
  collectCoverageFrom: ['src/**/*'],
  coverageReporters: ['lcov', 'text', 'html'],
}

export default config
