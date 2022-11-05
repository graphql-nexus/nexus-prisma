import * as Setset from 'setset'

export type Input = {
  /**
   * Map Prisma model fields of type `Int` with attribute `@id` to `ID` or `Int`.
   *
   * @default 'Int'
   */
  projectIdIntToGraphQL?: 'ID' | 'Int'
  // TODO once fixed https://github.com/homer0/packages/issues/21
  // use @default tag in this JSDoc block
  /**
   * Nexus Prisma will project your Prisma schema field/model/enum documentation into JSDoc of the generated Nexus Prisma API.
   *
   * This setting controls what Nexus Prisma should do when you have not written documentation in your Prisma Schema for a field/model/enum.
   *
   * The following modes are as follows:
   *
   * 1. `'none'`
   *
   *     In this mode, no default JSDoc will be written.
   *
   * 2. `'guide'`
   *
   *     In this mode, guide content into your JSDoc that looks something like the following:
   *
   *     ```
   *     * ### ️⚠️ You have not written documentation for ${thisItem}
   *
   *     * Replace this default advisory JSDoc with your own documentation about ${thisItem}
   *     * by documenting it in your Prisma schema. For example:
   *     * ...
   *     * ...
   *     * ...
   *     ```
   *
   * The default is `'guide'`.
   */
  jsdocPropagationDefault?: 'none' | 'guide'
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
         * @default true
         */
        JSDoc?: boolean
        /**
         * Should Prisma Schema docs propagate as GraphQL docs?
         *
         * @remarks When this is disabled it will force `.description` property to be `undefined`. This
         *          is for convenience, allowing you to avoid post-generation data manipulation or
         *          consumption contortions.
         * @default true
         */
        GraphQLDocs?: boolean
      }
  /**
   * Where Nexus Prisma will try to import your generated Prisma Client from.
   *
   * You should not need to configure this normally because Nexus Prisma generator automatically reads the
   * Prisma Client generator `output` setting if you have set it.
   *
   * The value here will be used in a dynamic import thus following Node's path resolution rules. You can pass
   * a node_modules package like `foo` `@prisma/client`
   * `@my/custom/thing` etc. or you can pass an absolute module/file path `/my/custom/thing` /
   * `/my/custom/thing/index.js` or finally a relative path to be resolved relative to the location of Nexus
   * Prisma source files (you probably don't want this).
   *
   * @remarks Nexus Prisma imports Prisma client internally for two reasons: 1) validation wherein a
   *          class reference to Prisma Client is needed for some `instanceof` checks and 2) for
   *          acquiring the DMMF as Nexus Prisma relies on some post-processing done by Prisma Client
   *          generator.
   * @default '@prisma/client'
   */
  prismaClientImportId?: string
  /**
   * Configure various details about the Nexus Prisma generated runtime such as file name and location.
   *
   * By default is output into the installed node_modules location of Nexus Prisma itself and supports both
   * ESM and CJS.
   *
   * The following files will be output into the target directory:
   *
   * ```
   * Description | Default Name | Extension |
   * ----------------------------------------------------
   * A runtime file | index | .js |
   * A type file | index | .d.ts |
   * ```
   *
   * Passing `string` is a path to the target directory to output to, shorthand for `{ directory: string }`
   *
   * If a relative path is given then it is considered relative to the Prisma Schema file.
   *
   * @example
   *
   * // Default
   *   // prisma/nexus-prisma.config.ts
   *   import { settings } from 'nexus-prisma/generator'
   *
   *   settings({
   *     output: undefined // The default
   *   })
   *
   *   // src/schema.ts
   *   import { ... } from 'nexus-prisma'
   *
   * @example
   *
   * // Custom
   *   // prisma/nexus-prisma.config.ts
   *   import { settings } from 'nexus-prisma/generator'
   *
   *   settings({
   *     output: '../src/generated/nexus-prisma'
   *   })
   *
   *   // src/schema.ts
   *   import { ... } from './generated/nexus-prisma'
   *
   */
  output?:
    | string
    | {
        /**
         * The directory to output the generated modules into.
         *
         * If a relative path is given then it is considered relative to the Prisma Schema file.
         *
         * By default Nexus Prisma runtime is output into its installed node_modules location.
         */
        directory: string
        /**
         * The name to use for the generated modules.
         *
         * @default 'index'
         */
        name?: string
      }
}

export type Data = Setset.InferDataFromInput<Input>

export type Manager = Setset.Manager<Input, Data>

export const create = () =>
  Setset.create<Input, Data>({
    fields: {
      output: {
        shorthand: (directory) => ({ directory }),
        initial: () => ({
          directory: 'default',
          name: 'index',
        }),
        fields: {
          directory: {
            initial: () => 'default',
          },
          name: {
            initial: () => 'index',
          },
        },
      },
      projectIdIntToGraphQL: {
        initial: () => 'Int',
      },
      jsdocPropagationDefault: {
        initial: () => 'guide',
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
