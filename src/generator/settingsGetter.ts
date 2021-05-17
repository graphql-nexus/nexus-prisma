import * as fs from 'fs'
import { settings } from '.'
import { SettingsData } from './settingsManager'

export function getSettings(): SettingsData {
  // eslint-disable-next-line
  const tsNode = require('ts-node')

  // eslint-disable-next-line
  tsNode.register({
    compilerOptions: { module: 'commonjs' },
  })

  const userSettingsModulePath = pickFirstExisting(
    [
      'nexus-prisma.ts',
      'nexusPrisma.ts',
      'nexus_prisma.ts',
      'prisma/nexus-prisma.ts',
      'prisma/nexusPrisma.ts',
      'prisma/nexus_prisma.ts',
    ].map((path) => `${process.cwd()}/${path}`)
  )

  /**
   * Load the user's settings module for side-effects against the settings manager.
   */

  if (userSettingsModulePath) {
    console.log(`Loaded configuration from ${userSettingsModulePath}`)
    require(userSettingsModulePath)
  }

  // eslint-disable-next-line
  return (settings as any).data
}

function pickFirstExisting(paths: string[]): null | string {
  return (
    paths.find((path) => {
      return fs.existsSync(path)
    }) ?? null
  )
}
