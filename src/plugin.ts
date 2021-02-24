import {} from '@prisma/generator-helper'
import * as Nexus from 'nexus'
import { generateRuntime } from './generator'
import { d } from './helpers/debugNexusPrisma'
import { getPrismaClientDmmf } from './helpers/prisma'
import { settings, SettingsInput } from './settings'

export const plugin = (settingsInput?: SettingsInput) => {
  return Nexus.plugin({
    name: 'nexus-prisma',
    onInstall() {
      d('nexus plugin onInstall')
      const settingsData = settings.change(settingsInput ?? {}).data
      const dmmf = getPrismaClientDmmf()
      generateRuntime(dmmf, settingsData)
    },
  })
}
