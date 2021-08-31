import * as fs from 'fs'
import kleur from 'kleur'
import type * as TSNode from 'ts-node'
import { d } from '../../helpers/debugNexusPrisma'
import { renderError } from '../../lib/diagnostic'

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

    let tsNode: typeof TSNode

    try {
      // eslint-disable-next-line
      tsNode = require('ts-node')
    } catch (error) {
      const nexusPrisma = `${kleur.yellow(`nexus-prisma`)}`
      const tsNode = `${kleur.yellow(`ts-node`)}`
      console.log(
        renderError({
          title: `Failed to read configuration module`,
          reason: `${nexusPrisma} uses ${tsNode} to read your generator configuration module, but there was an error while trying to import ${tsNode}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          consequence: `${nexusPrisma} will stop generation.`,
          solution: `Fix the ${tsNode} import error (missing dependency?) or stop using ${nexusPrisma} generator configuration module.`,
          code: 'nexus_prisma_ts_node_import',
        })
      )

      throw error
    }

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
