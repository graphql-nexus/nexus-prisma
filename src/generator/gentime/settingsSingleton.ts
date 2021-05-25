import * as Setset from 'setset'

export namespace Gentime {
  export type SettingsInput = {
    /**
     * TODO
     */
    projectIdIntToGraphQL?: 'ID' | 'Int'
	// TODO add some examples
    /**
     * Should Prisma Schema docs propagate as docs?
     *
     * @default true
     */
    docPropagation?:
      | boolean
      | {
          /**
           * Should Prisma Schema docs propagate as JSDoc?
           *
           * @default `true`
           */
          JSDoc?: boolean
          /**
           * Should Prisma Schema docs propagate as GraphQL docs?
           *
           * @remarks When this is disabled it will force `.description` property to be `undefined`. This
           *          is for convenience, allowing you to avoid post-generation data manipulation or
           *          consumption contortions.
           * @default `true`
           */
          GraphQLDocs?: boolean
        }
    /**
     * Where Nexus Prisma will try to import your generated Prisma Client from.
     *
     * You should not need to configure this normally because Nexus Prisma generator automatically reads the
     * Prisma Client generator `output` setting if you have set it.
     *
     * The value here will be used in a dynamic import thus following Node's path resolution rules. You can
     * pass a node_modules package like `foo` `@prisma/client`
     * `@my/custom/thing` etc. or you can pass an absolute module/file path `/my/custom/thing` /
     * `/my/custom/thing/index.js` or finally a relative path to be resolved relative to the location of Nexus
     * Prisma source files (you probably don't want this).
     *
     * @remarks Nexus Prisma imports Prisma client internally for two reasons: 1) validation wherein a
     *          class reference to Prisma Client is needed for some `instanceof` checks and 2) for
     *          acquiring the DMMF as Nexus Prisma relies on some post-processing done by Prisma Client
     *          generator.
     */
    prismaClientImportId?: string | null
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
      prismaClientImportId: {
        initial: () => `@prisma/client`,
      },
    },
  })

  export function changeSettings(input: Setset.UserInput<SettingsInput>): Settings {
    return settings.change(input)
  }
}
