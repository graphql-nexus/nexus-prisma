import * as Setset from 'setset'

export namespace Runtime {
  export type SettingsInput = {
    /**
     * The name of the GraphQL context field to get an instance of Prisma Client from.
     *
     * This instance of Prisma Client is accessed in the default resolvers for relational fields.
     *
     * @default prisma
     */
    prismaClientContextField?: string
  }

  export type SettingsData = Setset.InferDataFromInput<SettingsInput>

  export type Settings = Setset.Manager<SettingsInput, SettingsData>

  export const settings = Setset.create<SettingsInput, SettingsData>({
    fields: {
      prismaClientContextField: {
        initial: () => 'prisma',
      },
    },
  })

  export function changeSettings(input: Setset.UserInput<SettingsInput>): Settings {
    return settings.change(input)
  }
}
