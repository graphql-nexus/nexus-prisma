import { cosmiconfig } from 'cosmiconfig'
import TypeScriptLoader from '@endemolshinegroup/cosmiconfig-typescript-loader'
import { Configuration } from '../generator'

const CONFIGURATION_NAME = 'nexus-prisma'

export async function getConfiguration(): Promise<Configuration | null> {
  const explorer = cosmiconfig(CONFIGURATION_NAME, {
    searchPlaces: [
      'nexus-prisma.ts',
      'nexusPrisma.ts',
      'nexusPrisma.ts',
      'nexus-prisma.js',
      'nexusPrisma.js',
      'nexusPrisma.js',
      'prisma/nexus-prisma.ts',
      'prisma/nexusPrisma.ts',
      'prisma/nexusPrisma.ts',
      'prisma/nexus-prisma.js',
      'prisma/nexusPrisma.js',
      'prisma/nexusPrisma.js',
    ],
    loaders: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      '.ts': TypeScriptLoader,
    },
  })
  const result = await explorer.search()
  if (!result) {
    return null
  }
  console.log(`Loaded configuration from ${result.filepath}`)
  return result.config as Configuration
}
