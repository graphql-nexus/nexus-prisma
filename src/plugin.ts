import {} from '@prisma/generator-helper'
import endent from 'endent'
import { PrismaClient } from '@prisma/client'
import * as Nexus from 'nexus'
import { d } from './helpers/debugNexusPrisma'
import { SettingsInput, change } from './settings'

throw new Error(endent`
  Nexus Prisma is currently only available as a Prisma geneator.
`)

export function plugin(settingsInput?: SettingsInput): Nexus.core.NexusPlugin {
  return Nexus.plugin({
    name: 'nexus-prisma',
    onInstall() {
      d('nexus plugin onInstall')
      const settingsData = change({ ...settingsInput, prisma: new PrismaClient() }).data
      settingsData
    },
  })
}
