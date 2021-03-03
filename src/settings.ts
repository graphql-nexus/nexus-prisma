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
        // Any type expected here because Prisma Client not generated
        // Would have a type in a user's project, following prisma generate
        // eslint-disable-next-line
        return new PrismaClient()
      },
    },
  },
})
