import type { PrismaClient } from '@prisma/client'
import * as Setset from 'setset'

export type SettingsInput = {
  prisma?: PrismaClient
}

export type SettingsData = Setset.InferDataFromInput<SettingsInput>

export type Settings = Setset.Manager<SettingsInput, SettingsData>

export const settings = Setset.create<SettingsInput, SettingsData>({
  fields: {},
})

export const change = (input: Setset.UserInput<SettingsInput>): Settings => {
  return settings.change(input)
}
