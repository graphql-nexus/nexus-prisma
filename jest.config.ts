import type { InitialOptionsTsJest } from 'ts-jest/dist/types'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  // testPathIgnorePatterns: process.env.CI ? [] : ['.*e2e.*'],
  globals: {
    'ts-jest': {
      diagnostics: Boolean(process.env.CI)
        ? {
            // For some reason we get these diagnostic errors in CI but only sometimes
            // locally and never in editor. Furthermore the errors are invalid since they are
            // explicit any not implicit any! Example error in CI https://github.com/prisma/nexus-prisma/runs/2613820675#step:9:408
            ignoreCodes: [7006, 7031],
          }
        : false,
      tsconfig: '<rootDir>/tests/tsconfig.json',
    },
  },
  collectCoverageFrom: ['src/**/*'],
  coverageReporters: ['lcov', 'text', 'html'],
}

export default config
