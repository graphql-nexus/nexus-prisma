import TypeScriptLoader from '@endemolshinegroup/cosmiconfig-typescript-loader'
import { cosmiconfig } from 'cosmiconfig'
import { Configuration } from '../generator'

const CONFIGURATION_NAME = 'nexus-prisma'

export async function getConfiguration(): Promise<Configuration | null> {
  const explorer = cosmiconfig(CONFIGURATION_NAME, {
    searchPlaces: [
      'nexus-prisma.ts',
      'nexusPrisma.ts',
      'nexus_prisma.ts',
      'prisma/nexus-prisma.ts',
      'prisma/nexusPrisma.ts',
      'prisma/nexus_prisma.ts',
    ],
    loaders: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      '.ts': TypeScriptLoader,
    },
    packageProp: [],
  })

  const result = await explorer.search()

  if (!result) {
    return null
  }

  console.log(`Loaded configuration from ${result.filepath}`)

  // TODO runtime validation with zod
  return result.config as Configuration
}
