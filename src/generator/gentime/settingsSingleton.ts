import * as Setset from 'setset'

export namespace Gentime {
  export type SettingsInput = {
    /**
     * TODO
     */
    projectIdIntToGraphQL?: 'ID' | 'Int'
    /**
     * TODO
     */
    docPropagation?:
      | boolean
      | {
          /**
           * TODO
           */
          JSDoc?: boolean
          /**
           * TODO
           */
          GraphQLDocs?: boolean
        }
    /**
     * Location of your generated prisma client.
     */
    prismaClientLocation?: string | null
  }

  export type SettingsData = Setset.InferDataFromInput<SettingsInput>

  export type Settings = Setset.Manager<SettingsInput, SettingsData>

  export const settings = Setset.create<SettingsInput, SettingsData>({
    fields: {
      projectIdIntToGraphQL: {
        initial: () => 'Int',
      },
      docPropagation: {
        shorthand: (enabled) => ({
          GraphQLDocs: enabled,
          JSDoc: enabled,
        }),
        fields: {
          GraphQLDocs: {
            initial: () => true,
          },
          JSDoc: {
            initial: () => true,
          },
        },
      },
      prismaClientLocation: {
        initial: () => null,
      },
    },
  })

  export function changeSettings(input: Setset.UserInput<SettingsInput>): Settings {
    return settings.change(input)
  }
}
