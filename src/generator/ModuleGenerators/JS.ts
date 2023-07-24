import dedent from 'dindist'
import { chain } from 'lodash'
import * as Nexus from 'nexus'
import { NexusEnumTypeConfig, NexusListDef, NexusNonNullDef, NexusNullDef } from 'nexus/dist/core'
import { inspect } from 'util'

import type { DMMF } from '@prisma/client/runtime'

import { MaybePromise, RecordUnknown, Resolver } from '../../helpers/utils'
import { Messenger } from '../../lib/messenger'
import { PrismaDmmf } from '../../lib/prisma-dmmf'
import { PrismaDocumentation } from '../../lib/prisma-documentation'
import { PrismaUtils } from '../../lib/prisma-utils'
import { createWhereUniqueInput } from '../../lib/prisma-utils/whereUniqueInput'
import { Module } from '../helpers/types'
import { Settings } from '../Settings'
import { fieldTypeToGraphQLType } from './TS'

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
  runtime: Settings.Runtime.Manager
  gentime: Settings.Gentime.Data
}

/**
 * Create the module specification for the JavaScript runtime.
 */
export const createModule = (params: {
  /**
   * Resolved generator settings (whatever user supplied merged with defaults).
   */
  gentimeSettings: Settings.Gentime.Manager
  /**
   * Should the module be generated using ESM instead of CJS?
   */
  esm: boolean
  /**
   * Detailed data about the Prisma Schema contents and available operations over its models.
   */
  dmmf: DMMF.Document
}): Module => {
  const { esm, gentimeSettings, dmmf } = params

  const esmModelExports =
    dmmf.datamodel.models
      .map((model) => {
        return dedent`
        export const ${model.name} = nexusTypeDefConfigurations['${model.name}']
      `
      })
      .join('\n') || `// N/A -- You have not defined any models in your Prisma Schema.`

  const esmEnumExports =
    dmmf.datamodel.enums
      .map((enum_) => {
        return dedent`
          export const ${enum_.name} = nexusTypeDefConfigurations['${enum_.name}']
        `
      })
      .join('\n') || `// N/A -- You have not defined any enums in your Prisma Schema.`

  const exports = esm
    ? dedent`
        //
        // Exports
        //

        // Static API Exports

        export const $settings = RuntimeSettings.changeSettings

        // Reflected Model Exports

        ${esmModelExports}

        // Reflected Enum Exports

        ${esmEnumExports}
      `
    : dedent`
        module.exports = {
          $settings: RuntimeSettings.changeSettings,
          ...nexusTypeDefConfigurations,
        }
      `

  const importSpecifierToNexusPrismaSourceDirectory = esm ? `nexus-prisma/dist-esm` : `nexus-prisma/dist-cjs`
  const imports = esm
    ? dedent`
        import { getPrismaClientDmmf } from '${importSpecifierToNexusPrismaSourceDirectory}/helpers/prisma'
        import { ModuleGenerators } from '${importSpecifierToNexusPrismaSourceDirectory}/generator/ModuleGenerators/index'
        import * as RuntimeSettings from '${importSpecifierToNexusPrismaSourceDirectory}/generator/Settings/Runtime/index'
      `
    : dedent`
        const { getPrismaClientDmmf } = require('${importSpecifierToNexusPrismaSourceDirectory}/helpers/prisma')
        const { ModuleGenerators } = require('${importSpecifierToNexusPrismaSourceDirectory}/generator/ModuleGenerators/index')
        const RuntimeSettings = require('${importSpecifierToNexusPrismaSourceDirectory}/generator/Settings/Runtime/index')
      `

  return {
    // TODO this is no longer used, just return content
    fileName: 'index.js',
    content: dedent`
      ${imports}

      const gentimeSettingsData = ${JSON.stringify(gentimeSettings.data, null, 2)}
      const runtimeSettingsManager = RuntimeSettings.settings

      const dmmf = getPrismaClientDmmf({
        // JSON stringify the values to ensure proper escaping
        // Details: https://github.com/prisma/nexus-prisma/issues/143
        // TODO test that fails without this code
        require: () => require(${JSON.stringify(gentimeSettings.data.prismaClientImportId)}),
        importId: gentimeSettingsData.prismaClientImportId,
        importIdResolved: require.resolve(${JSON.stringify(gentimeSettings.data.prismaClientImportId)})
      })

      const nexusTypeDefConfigurations = ModuleGenerators.JS.createNexusTypeDefConfigurations(dmmf, {
        gentime: gentimeSettingsData,
        runtime: runtimeSettingsManager,
      })

      ${exports}
    `,
  }
}

export const createNexusTypeDefConfigurations = (
  dmmf: DMMF.Document,
  settings: Settings,
): NexusTypeDefConfigurations => {
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
const createNexusObjectTypeDefConfigurations = (
  dmmf: DMMF.Document,
  settings: Settings,
): NexusObjectTypeDefConfigurations => {
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
export const prismaFieldToNexusType = (field: DMMF.Field, settings: Settings) => {
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
export const nexusResolverFromPrismaField = (
  model: DMMF.Model,
  field: DMMF.Field,
  settings: Settings,
): undefined | Resolver => {
  if (field.kind !== 'object') {
    return undefined
  }

  return (source: RecordUnknown, _args: RecordUnknown, ctx: RecordUnknown): MaybePromise<unknown> => {
    const whereUnique = createWhereUniqueInput(source, model)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma: any = ctx[settings.runtime.data.prismaClientContextField]
    const prismaOrmModelPropertyName = PrismaUtils.typeScriptOrmModelPropertyNameFromModelName(model.name)

    if (settings.runtime.data.checks.PrismaClientOnContext.enabled) {
      const performInstanceOfStrategy = () => {
        // eslint-disable-next-line
        let PrismaClientPackage: any
        try {
          // eslint-disable-next-line
          PrismaClientPackage = require(settings.gentime.prismaClientImportId)
        } catch (e) {
          // TODO rich errors
          throw new Error(
            `Could not perform "PrismaClientOnContext" check because there was an error while trying to import Prisma Client:\n\n${String(
              e,
            )}`,
          )
        }

        if (
          !(
            PrismaClientPackage !== null &&
            typeof PrismaClientPackage === 'object' &&
            // eslint-disable-next-line
            typeof PrismaClientPackage.PrismaClient === 'function'
          )
        ) {
          // TODO rich errors
          throw new Error(
            `Could not perform "PrismaClientOnContext" check because could not get a reference to a valid Prisma Client class. Found:\n\n${inspect(
              PrismaClientPackage,
            )}`,
          )
        }

        // eslint-disable-next-line
        return prisma instanceof PrismaClientPackage.PrismaClient
      }
      if (settings.runtime.data.checks.PrismaClientOnContext.strategy === 'duckType') {
        if (!PrismaUtils.duckTypeIsPrismaClient(prisma, prismaOrmModelPropertyName)) {
          console.error(1)
          // TODO rich errors
          throw new Error(
            `Check "PrismaClientOnContext" failed using "duckType" strategy. The GraphQL context.${settings.runtime.data.prismaClientContextField} value is not an instance of the Prisma Client.`,
          )
        }
      } else if (settings.runtime.data.checks.PrismaClientOnContext.strategy === 'instanceOf') {
        if (!performInstanceOfStrategy()) {
          throw new Error(
            `Check "PrismaClientOnContext" failed using "instanceOf" strategy. The GraphQL context.${settings.runtime.data.prismaClientContextField} value is not an instance of the Prisma Client.`,
          )
        }
      } else {
        if (!performInstanceOfStrategy()) {
          if (!PrismaUtils.duckTypeIsPrismaClient(prisma, prismaOrmModelPropertyName)) {
            // TODO rich errors
            throw new Error(
              `Check "PrismaClientOnContext" failed using "instanceOf_duckType_fallback" strategy. The GraphQL context.${settings.runtime.data.prismaClientContextField} value is not an instance of the Prisma Client.`,
            )
          }
          // DuckType passed but InstanceOf strategy failed, so show a warning.
          Messenger.showWarning({
            code: 'PrismaClientOnContextInstanceOfStrategyFailed',
            title: `Prisma Client on GraphQL context failed being checked using instanceof`,
            reason: `The Prisma Client class reference imported from ${settings.gentime.prismaClientImportId} is not the same class used by you to create your Prisma Client instance.`,
            consequence: `Maybe none since duck typing fallback indicates that the Prisma Client on the GraphQL context is actually valid. However relying on duck typing is hacky.`,
          })
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const prismaModel = prisma[prismaOrmModelPropertyName]

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
const createNexusEnumTypeDefConfigurations = (
  dmmf: DMMF.Document,
  settings: Settings,
): NexusEnumTypeDefConfigurations => {
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
