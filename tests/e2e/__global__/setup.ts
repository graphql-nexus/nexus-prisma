import * as Execa from 'execa'
import type { Config } from '@jest/types'
import { getPackageManager } from '../../__helpers__/packageManager'

export default async (_globalConfig: Config.GlobalConfig, _projectConfig: Config.ProjectConfig) => {
  console.log('\nPublishing nexus-prisma locally')
  await Execa.command(`${getPackageManager()} -s yalc publish --no-scripts`)
}
