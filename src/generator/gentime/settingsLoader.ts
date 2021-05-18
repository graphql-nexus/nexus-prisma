import * as fs from 'fs'

export function loadUserGentimeSettings(): void {
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
   * Load the user's settings module for side-effects against the setset instance.
   */

  if (userSettingsModulePath) {
    console.log(`Loaded configuration from ${userSettingsModulePath}`)
    require(userSettingsModulePath)
  }
}

function pickFirstExisting(paths: string[]): null | string {
  return (
    paths.find((path) => {
      return fs.existsSync(path)
    }) ?? null
  )
}
