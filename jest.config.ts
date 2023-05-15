import type { InitialOptionsTsJest } from 'ts-jest/dist/types'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
  ],
  collectCoverageFrom: ['src/**/*'],
  coverageReporters: ['lcov', 'text', 'html'],
  projects: [`<rootDir>/jest.config.e2e.ts`, `<rootDir>/jest.config.unit.ts`],
  testTimeout: 5*60*1000,
}

export default config
