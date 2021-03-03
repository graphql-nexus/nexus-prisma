import {} from '@prisma/generator-helper'
import * as Nexus from 'nexus'
import { d } from './helpers/debugNexusPrisma'
import { settings, SettingsInput } from './settings'

export function plugin(settingsInput?: SettingsInput): Nexus.core.NexusPlugin {
  return Nexus.plugin({
    name: 'nexus-prisma',
    onInstall() {
      d('nexus plugin onInstall')
      const settingsData = settings.change(settingsInput ?? {}).data
      settingsData
    },
  })
}
