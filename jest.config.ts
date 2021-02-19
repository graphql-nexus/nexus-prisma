import type { InitialOptionsTsJest } from 'ts-jest/dist/types'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  globals: {
    'ts-jest': {
      diagnostics: Boolean(process.env.CI),
      babelConfig: false,
      tsconfig: '<rootDir>/tests/tsconfig.json',
    },
  },
}

export default config
