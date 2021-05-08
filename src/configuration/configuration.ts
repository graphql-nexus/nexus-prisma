import { cosmiconfig } from 'cosmiconfig'
import TypeScriptLoader from '@endemolshinegroup/cosmiconfig-typescript-loader'
import { Configuration } from '../generator'

const CONFIGURATION_NAME = 'nexus-prisma'

export async function getConfiguration(): Promise<Configuration> {
  const explorer = cosmiconfig(CONFIGURATION_NAME, {
    searchPlaces: [
      'package.json',
      `.${CONFIGURATION_NAME}rc`,
      `.${CONFIGURATION_NAME}rc.json`,
      `.${CONFIGURATION_NAME}rc.yaml`,
      `.${CONFIGURATION_NAME}rc.yml`,
      `.${CONFIGURATION_NAME}rc.js`,
      `.${CONFIGURATION_NAME}rc.ts`,
      `.${CONFIGURATION_NAME}rc.cjs`,
      `${CONFIGURATION_NAME}.config.js`,
      `${CONFIGURATION_NAME}.config.cjs`,
      `${CONFIGURATION_NAME}.config.ts`,
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
