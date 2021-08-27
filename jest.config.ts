import type { InitialOptionsTsJest } from 'ts-jest/dist/types'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  testPathIgnorePatterns: process.env.CI ? [] : ['.*e2e.*'],
  collectCoverageFrom: ['src/**/*'],
  coverageReporters: ['lcov', 'text', 'html'],
}

export default config
