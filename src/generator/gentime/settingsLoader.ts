import * as fs from 'fs'
import type * as TSNode from 'ts-node'
import { d } from '../../helpers/debugNexusPrisma'

export function loadUserGentimeSettings(): void {
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

  if (userSettingsModulePath) {
    // Now that we know a TS config file is present, try loading ts-node

    // eslint-disable-next-line
    let tsNode: typeof TSNode = require('ts-node')

    // eslint-disable-next-line
    tsNode.register({
      compilerOptions: {
        module: 'commonjs',
      },
    })

    // Load the user's settings module for side-effects against the setset instance.

    d(`Loaded configuration from ${userSettingsModulePath}`)
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
