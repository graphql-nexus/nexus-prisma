import type { DMMF } from '@prisma/client/runtime'
import dedent from 'dindist'
import { chain } from 'lodash'
import * as Nexus from 'nexus'
import { NexusEnumTypeConfig, NexusListDef, NexusNonNullDef, NexusNullDef } from 'nexus/dist/core'
import { MaybePromise, RecordUnknown, Resolver } from '../../helpers/utils'
import { PrismaDmmf } from '../../lib/prisma-dmmf'
import { PrismaDocumentation } from '../../lib/prisma-documentation'
import { PrismaUtils } from '../../lib/prisma-utils'
import { Gentime } from '../gentime/settingsSingleton'
import { createWhereUniqueInput } from '../../lib/prisma-utils/whereUniqueInput'
import { Runtime } from '../runtime/settingsSingleton'
import { ModuleSpec } from '../types'
import { fieldTypeToGraphQLType } from './declaration'

type PrismaEnumName = string

type PrismaModelName = string

type PrismaModelOrEnumName = string

type PrismaFieldName = string

type PrismaModelFieldNameOrMetadataFieldName = string

type NexusTypeDefConfigurations = Record<
  PrismaModelOrEnumName,
  NexusObjectTypeDefConfiguration | NexusEnumTypeDefConfiguration
>

export type Settings = {
  runtime: Runtime.Settings
  gentime: Gentime.SettingsData
}

/**
 * Create the module specification for the JavaScript runtime.
 */
export function createModuleSpec(params: {
  /**
   * Resolved generator settings (whatever user supplied merged with defaults).
   */
  gentimeSettings: Gentime.Settings
  /**
   * Should the module be generated using ESM instead of CJS?
   */
  esm: boolean
  /**
   * Detailed data about the Prisma Schema contents and available operations over its models.
   */
  dmmf: DMMF.Document
}): ModuleSpec {
  const { esm, gentimeSettings, dmmf } = params

  const esmModelExports =
    dmmf.datamodel.models
      .map((model) => {
        return dedent`
        export const ${model.name} = models['${model.name}']
      `
      })
      .join('\n') || `// N/A -- You have not defined any models in your Prisma Schema.`

  const esmEnumExports =
    dmmf.datamodel.enums
      .map((enum_) => {
        return dedent`
          export const ${enum_.name} = models['${enum_.name}']
        `
      })
      .join('\n') || `// N/A -- You have not defined any enums in your Prisma Schema.`

  const exports = esm
    ? dedent`
        //
        // Exports
        //

        // Static API Exports

        export const $settings = Runtime.settings.change

        // Reflected Model Exports

        ${esmModelExports}

        // Reflected Enum Exports

        ${esmEnumExports}
      `
    : dedent`
        module.exports = {
          $settings: Runtime.settings.change,
          ...models,
        }
      `

  const importSpecifierToNexusPrismaSourceDirectory =
    gentimeSettings.data.output.directory === 'default'
      ? `..`
      : esm
      ? `nexus-prisma/dist-esm`
      : `nexus-prisma/dist-cjs`
  const imports = esm
    ? dedent`
        import { getPrismaClientDmmf } from '${importSpecifierToNexusPrismaSourceDirectory}/helpers/prisma'
        import * as ModelsGenerator from '${importSpecifierToNexusPrismaSourceDirectory}/generator/models/index'
        import { Runtime } from '${importSpecifierToNexusPrismaSourceDirectory}/generator/runtime/settingsSingleton'
      `
    : dedent`
        const { getPrismaClientDmmf } = require('${importSpecifierToNexusPrismaSourceDirectory}/helpers/prisma')
        const ModelsGenerator = require('${importSpecifierToNexusPrismaSourceDirectory}/generator/models/index')
        const { Runtime } = require('${importSpecifierToNexusPrismaSourceDirectory}/generator/runtime/settingsSingleton')
      `

  return {
    // TODO this is no longer used, just return content
    fileName: 'index.js',
    content: dedent`
      ${imports}

      const gentimeSettings = ${JSON.stringify(gentimeSettings.data, null, 2)}

      const dmmf = getPrismaClientDmmf({
        // JSON stringify the values to ensure proper escaping
        // Details: https://github.com/prisma/nexus-prisma/issues/143
        // TODO test that fails without this code
        require: () => require(${JSON.stringify(gentimeSettings.data.prismaClientImportId)}),
        importId: gentimeSettings.prismaClientImportId,
        importIdResolved: require.resolve(${JSON.stringify(gentimeSettings.data.prismaClientImportId)})
      })

      const models = ModelsGenerator.JS.createNexusTypeDefConfigurations(dmmf, {
        runtime: Runtime.settings,
        gentime: gentimeSettings,
      })

      ${exports}
    `,
  }
}

export function createNexusTypeDefConfigurations(
  dmmf: DMMF.Document,
  settings: Settings
): NexusTypeDefConfigurations {
  return {
    ...createNexusObjectTypeDefConfigurations(dmmf, settings),
    ...createNexusEnumTypeDefConfigurations(dmmf, settings),
  }
}

type NexusObjectTypeDefConfigurations = Record<PrismaModelName, NexusObjectTypeDefConfiguration>

type NexusObjectTypeDefConfiguration = Record<
  PrismaModelFieldNameOrMetadataFieldName,
  | {
      name: PrismaFieldName
      type: NexusNonNullDef<string> | NexusListDef<string> | NexusNullDef<string>
      description: string
    }
  // Metadata fields can be any of these
  | string
  | undefined
>

/**
 * Create Nexus object type definition configurations for Prisma models found in the given DMMF.
 */
function createNexusObjectTypeDefConfigurations(
  dmmf: DMMF.Document,
  settings: Settings
): NexusObjectTypeDefConfigurations {
  return chain(dmmf.datamodel.models)
    .map((model) => {
      return {
        $name: model.name,
        $description: prismaNodeDocumentationToDescription({ settings, node: model }),
        ...chain(model.fields)
          .map((field) => {
            return {
              name: field.name,
              type: prismaFieldToNexusType(field, settings),
              description: prismaNodeDocumentationToDescription({ settings, node: field }),
              resolve: nexusResolverFromPrismaField(model, field, settings),
            }
          })
          .keyBy('name')
          .value(),
      }
    })
    .keyBy('$name')
    .value()
}

const prismaNodeDocumentationToDescription = (params: {
  settings: Settings
  node: PrismaDmmf.DocumentableNode
}): string | undefined => {
  return params.settings.gentime.docPropagation.GraphQLDocs && params.node.documentation
    ? PrismaDocumentation.format(params.node.documentation)
    : undefined
}

// Complex return type I don't really understand how to easily work with manually.
// eslint-disable-next-line
export function prismaFieldToNexusType(field: DMMF.Field, settings: Settings) {
  const graphqlType = fieldTypeToGraphQLType(field, settings.gentime)

  if (field.isList) {
    return Nexus.nonNull(Nexus.list(Nexus.nonNull(graphqlType)))
  } else if (field.isRequired) {
    return Nexus.nonNull(graphqlType)
  } else {
    return Nexus.nullable(graphqlType)
  }
}

/**
 * Create a GraphQL resolver for the given Prisma field. If the Prisma field is a scalar then no resolver is
 * returned and instead the Nexus default is relied upon.
 *
 * @remarks Allow Nexus default resolver to handle resolving scalars.
 *
 *          By using Nexus default we also affect its generated types, assuming there are not explicit
 *          source types setup which actually for Nexus Prisma projects there usually will be (the Prisma
 *          model types). Still, using the Nexus default is a bit more idiomatic and provides the better
 *          _default_ type generation experience of scalars being expected to come down from the source
 *          type (aka. parent).
 *
 *          So:
 *
 *          ```ts ...
 *          t.field(M1.Foo.bar)
 *          ```
 *
 *          where `bar` is a scalar prisma field would have NO resolve generated and thus default Nexus
 *          as mentioned would think that `bar` field WILL be present on the source type. This is, again,
 *          mostly moot since most Nexus Prisma users WILL setup the Prisma source types e.g.:
 *
 *          ```ts ...
 *          sourceTypes: { modules: [{ module: '.prisma/client', alias: 'PrismaClient' }]},
 *          ```
 *
 *          but this is overall the better way to handle this detail it seems.
 */
export function nexusResolverFromPrismaField(
  model: DMMF.Model,
  field: DMMF.Field,
  settings: Settings
): undefined | Resolver {
  if (field.kind !== 'object') {
    return undefined
  }

  return (source: RecordUnknown, _args: RecordUnknown, ctx: RecordUnknown): MaybePromise<unknown> => {
    const whereUnique = createWhereUniqueInput(source, model)

    // eslint-disable-next-line
    const PrismaClientPackage = require(settings.gentime.prismaClientImportId)

    // eslint-disable-next-line
    if (!(ctx[settings.runtime.data.prismaClientContextField] instanceof PrismaClientPackage.PrismaClient)) {
      // TODO rich errors
      throw new Error(
        `The GraphQL context.${settings.runtime.data.prismaClientContextField} value is not an instance of the Prisma Client (class reference for check imported from ${settings.gentime.prismaClientImportId}).`
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma: any = ctx[settings.runtime.data.prismaClientContextField]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const prismaModel = prisma[PrismaUtils.typeScriptOrmModelPropertyNameFromModelName(model.name)]

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof prismaModel.findUnique !== 'function') {
      // TODO rich errors
      throw new Error(`The prisma model ${model.name} does not have a findUnique method available.`)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const findUnique = prismaModel.findUnique as (query: unknown) => MaybePromise<unknown>

    const result: unknown = findUnique({
      where: whereUnique,
      /**
       *
       * The user might have configured Prisma Client globally to rejectOnNotFound.
       * In the context of this Nexus Prisma managed resolver, we don't want that setting to
       * be a behavioral factor. Instead, Nexus Prisma has its own documented rules about the logic
       * it uses to project nullability from the database to the api.
       *
       * More details about this design can be found in the README.
       *
       * References:
       *
       * - https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#rejectonnotfound
       */
      rejectOnNotFound: false,
    })

    // @ts-expect-error Only known at runtime
    // eslint-disable-next-line
    return result[field.name]()
  }
}

type AnyNexusEnumTypeConfig = NexusEnumTypeConfig<string>

type NexusEnumTypeDefConfigurations = Record<PrismaEnumName, NexusEnumTypeDefConfiguration>

type NexusEnumTypeDefConfiguration = AnyNexusEnumTypeConfig

/**
 * Create Nexus enum type definition configurations for Prisma enums found in the given DMMF.
 */
function createNexusEnumTypeDefConfigurations(
  dmmf: DMMF.Document,
  settings: Settings
): NexusEnumTypeDefConfigurations {
  return chain(dmmf.datamodel.enums)
    .map((enum_): AnyNexusEnumTypeConfig => {
      return {
        name: enum_.name,
        description: prismaNodeDocumentationToDescription({ settings, node: enum_ }),
        members: enum_.values.map((val) => val.name),
      }
    })
    .keyBy('name')
    .value()
}
