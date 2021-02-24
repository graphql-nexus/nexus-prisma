import { PrismaClient } from '@prisma/client'
import * as Setset from 'setset'

export type SettingsInput = {
  prisma?: PrismaClient
}

export type SettingsData = Setset.InferDataFromInput<SettingsInput>

export const settings = Setset.create<SettingsInput, SettingsData>({
  fields: {
    prisma: {
      initial() {
        return new PrismaClient()
      },
    },
  },
})
