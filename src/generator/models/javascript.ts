import { DMMF } from '@prisma/client/runtime'
import endent from 'endent'
import { chain, lowerFirst } from 'lodash'
import * as Nexus from 'nexus'
import { NexusEnumTypeConfig, NexusListDef, NexusNonNullDef, NexusNullDef } from 'nexus/dist/core'
import { MaybePromise, RecordUnknown, Resolver } from '../../helpers/utils'
import { Gentime } from '../gentime/settingsSingleton'
import {
  buildWhereUniqueInput,
  findMissingUniqueIdentifiers,
  resolveUniqueIdentifiers,
} from '../helpers/constraints'
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
  internal: {
    /**
     * The import ID of prisma client.
     *
     * @remarks Used to get a class reference to do an instance check for runtime validation reasons.
     * @default @prisma/client
     */
    prismaClientImport: string
  }
}

/**
 * Create the module specification for the JavaScript runtime.
 */
export function createModuleSpec(gentimeSettings: Gentime.Settings): ModuleSpec {
  return {
    fileName: 'index.js',
    content: endent`
      const { getPrismaClientDmmf } = require('../helpers/prisma')
      const ModelsGenerator = require('../generator/models')
      const { Runtime } = require('../generator/runtime/settingsSingleton')

      const gentimeSettings = ${JSON.stringify(gentimeSettings.data, null, 2)}

      const dmmf = getPrismaClientDmmf()
      const models = ModelsGenerator.JS.createNexusTypeDefConfigurations(dmmf, {
        runtime: Runtime.settings,
        gentime: gentimeSettings,
        internal: {
          prismaClientImport: '@prisma/client',
        }
      })

      module.exports = models
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
        $description: settings.gentime.docPropagation.GraphQLDocs ? model.documentation : undefined,
        ...chain(model.fields)
          .map((field) => {
            return {
              name: field.name,
              type: prismaFieldToNexusType(field, settings),
              description: settings.gentime.docPropagation.GraphQLDocs ? field.documentation : undefined,
              resolve: prismaFieldToNexusResolver(model, field, settings),
            }
          })
          .keyBy('name')
          .value(),
      }
    })
    .keyBy('$name')
    .value()
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

export function prismaFieldToNexusResolver(
  model: DMMF.Model,
  field: DMMF.Field,
  settings: Settings
): undefined | Resolver {
  /**
   * Allow Nexus default resolver to handle resolving scalars.
   *
   * By using Nexus default we also affect its generated types, assuming there are not explicit source types setup
   * which actually for Nexus Prisma projects there usually will be (the Prisma model types). Still, using the Nexus
   * default is a bit more idiomatic and provides the better _default_ type generation experience of scalars being
   * expected to come down from the source type (aka. parent).
   *
   * So:
   *
   *     t.field(M1.Foo.bar.$name, M1.Foo.bar)
   *
   * where `bar` is a scalar prisma field would have NO resolve generated and thus default Nexus as mentioned would
   * think that `bar` field WILL be present on the source type. This is, again, mostly moot since most Nexus Prisma
   * users WILL setup the Prisma source types e.g.:
   *
   *     sourceTypes: {
   *       modules: [{ module: '.prisma/client', alias: 'PrismaClient' }],
   *     },
   *
   * but this is overall the better way to handle this detail it seems.
   */
  if (field.kind !== 'object') {
    return undefined
  }

  return (root: RecordUnknown, _args: RecordUnknown, ctx: RecordUnknown): MaybePromise<unknown> => {
    if (!ctx.prisma) {
      // TODO rich errors
      throw new Error(
        'Prisma client not found in context. Set a Prisma client instance to `prisma` field of Nexus context'
      )
    }

    const uniqueIdentifiers = resolveUniqueIdentifiers(model)
    const missingIdentifiers = findMissingUniqueIdentifiers(root, uniqueIdentifiers)

    if (missingIdentifiers !== null) {
      // TODO rich errors
      throw new Error(
        `Resolver ${model.name}.${
          field.name
        } is missing the following unique identifiers: ${missingIdentifiers.join(', ')}`
      )
    }

    // eslint-disable-next-line
    const PrismaClientPackage = require(settings.internal.prismaClientImport)

    // eslint-disable-next-line
    if (!(ctx[settings.runtime.data.prismaClientContextField] instanceof PrismaClientPackage.PrismaClient)) {
      // TODO rich errors
      throw new Error(
        `The GraphQL context.${settings.runtime.data.prismaClientContextField} value is not an instance of the Prisma Client (class reference for check imported from ${settings.internal.prismaClientImport}).`
      )
    }

    const propertyModelName = lowerFirst(model.name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma: any = ctx[settings.runtime.data.prismaClientContextField]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const prismaModel = prisma[propertyModelName]

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof prismaModel.findUnique !== 'function') {
      // TODO rich errors
      throw new Error(`The prisma model ${model.name} does not have a findUnique method available.`)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const findUnique = prismaModel.findUnique as (query: unknown) => MaybePromise<unknown>

    const result: unknown = findUnique({
      where: buildWhereUniqueInput(root, uniqueIdentifiers),
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
    .map(
      (enum_): AnyNexusEnumTypeConfig => {
        return {
          name: enum_.name,
          description: settings.gentime.docPropagation.GraphQLDocs ? enum_.documentation : undefined,
          members: enum_.values.map((val) => val.name),
        }
      }
    )
    .keyBy('name')
    .value()
}
