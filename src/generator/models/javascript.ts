import { PrismaClient } from '.prisma/client'
import { DMMF } from '@prisma/client/runtime'
import endent from 'endent'
import { chain, lowerFirst } from 'lodash'
import * as Nexus from 'nexus'
import { NexusEnumTypeConfig, NexusListDef, NexusNonNullDef, NexusNullDef } from 'nexus/dist/core'
import { MaybePromise, RecordUnknown, Resolver } from '../../helpers/utils'
import {
  buildWhereUniqueInput,
  findMissingUniqueIdentifiers,
  resolveUniqueIdentifiers,
} from '../helpers/constraints'
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

/**
 * Create the module specification for the JavaScript runtime.
 */
export function createModuleSpec(): ModuleSpec {
  return {
    fileName: 'index.js',
    content: endent`
      const { getPrismaClientDmmf } = require('../helpers/prisma')
      const ModelsGenerator = require('../generator/models')

      const dmmf = getPrismaClientDmmf()
      const models = ModelsGenerator.JS.createNexusTypeDefConfigurations(dmmf)

      module.exports = models
    `,
  }
}

export function createNexusTypeDefConfigurations(dmmf: DMMF.Document): NexusTypeDefConfigurations {
  return {
    ...createNexusObjectTypeDefConfigurations(dmmf),
    ...createNexusEnumTypeDefConfigurations(dmmf),
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
function createNexusObjectTypeDefConfigurations(dmmf: DMMF.Document): NexusObjectTypeDefConfigurations {
  return chain(dmmf.datamodel.models)
    .map((model) => {
      return {
        $name: model.name,
        $description: model.documentation,
        ...chain(model.fields)
          .map((field) => {
            return {
              name: field.name,
              type: prismaFieldToNexusType(field),
              description: field.documentation,
              resolve: prismaFieldToNexusResolver(model, field),
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
export function prismaFieldToNexusType(field: DMMF.Field) {
  const graphqlType = fieldTypeToGraphQLType(field)

  if (field.isList) {
    return Nexus.nonNull(Nexus.list(Nexus.nonNull(graphqlType)))
  } else if (field.isRequired) {
    return Nexus.nonNull(graphqlType)
  } else {
    return Nexus.nullable(graphqlType)
  }
}

export function prismaFieldToNexusResolver(model: DMMF.Model, field: DMMF.Field): Resolver {
  // Return default scalar resolver
  if (field.kind !== 'object') {
    return (root: RecordUnknown, _args: RecordUnknown, _ctx: RecordUnknown): MaybePromise<unknown> => {
      return root[field.name]
    }
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

    if (!(ctx.prisma instanceof PrismaClient)) {
      // TODO rich errors
      throw new Error(`todo`)
    }

    const methodName = lowerFirst(model.name)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma: any = ctx.prisma
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const prismaModel = prisma[methodName]

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof prismaModel.findUnique !== 'function') {
      // TODO rich errors
      throw new Error(`todo`)
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
function createNexusEnumTypeDefConfigurations(dmmf: DMMF.Document): NexusEnumTypeDefConfigurations {
  return chain(dmmf.datamodel.enums)
    .map(
      (enum_): AnyNexusEnumTypeConfig => {
        return {
          name: enum_.name,
          description: enum_.documentation,
          members: enum_.values.map((val) => val.name),
        }
      }
    )
    .keyBy('name')
    .value()
}
