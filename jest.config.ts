import type { JestConfigWithTsJest } from 'ts-jest/dist/types'

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
  ],
  collectCoverageFrom: ['src/**/*'],
  coverageReporters: ['lcov', 'text', 'html'],
  projects: [`<rootDir>/jest.config.e2e.ts`, `<rootDir>/jest.config.unit.ts`],
}

export default config
