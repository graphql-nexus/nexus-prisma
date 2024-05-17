import dedent from 'dindist'
import { chain, camelCase } from 'lodash'
import * as Nexus from 'nexus'
import {
  NexusEnumTypeConfig,
  ArgsRecord,
  NexusListDef,
  NexusNonNullDef,
  NexusNullDef,
  NexusInputObjectTypeDef,
  NexusEnumTypeDef,
} from 'nexus/dist/core'

import type { DMMF } from '@prisma/client/runtime/library'

import { MaybePromise, RecordUnknown, Resolver } from '../../helpers/utils'
import { PrismaDmmf } from '../../lib/prisma-dmmf'
import { PrismaDocumentation } from '../../lib/prisma-documentation'
import { PrismaUtils } from '../../lib/prisma-utils'
import { createWhereUniqueInput } from '../../lib/prisma-utils/whereUniqueInput'
import { Module } from '../helpers/types'
import { Settings } from '../Settings'
import { fieldTypeToGraphQLType } from './TS'
import { Maybe } from 'graphql/jsutils/Maybe'
import { getPrismaModel } from '../../lib/prisma-utils/model'
import { StandardGraphQLScalarType, StandardGraphQLScalarTypes } from '../../helpers/graphql'
import {
  GraphQLFieldMap,
  GraphQLInputFieldMap,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLSchema,
  GraphQLType,
} from 'graphql/type'

type PrismaEnumName = string

type PrismaModelName = string

type PrismaModelOrEnumName = string

type PrismaFieldName = string

type PrismaModelFieldNameOrMetadataFieldName = string

type NexusTypeDefConfigurations = Record<
  PrismaModelOrEnumName,
  NexusObjectTypeDefConfiguration | NexusEnumTypeDefConfiguration | NexusObjectListTypeDefConfiguration
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
    ...createNexusInputTypeDefConfigurations(dmmf, settings),
    ...createNexusEnumTypeDefConfigurations(dmmf, settings),
  }
}

type NexusObjectTypeDefConfigurations = Record<
  PrismaModelName,
  NexusObjectTypeDefConfiguration | NexusObjectListTypeDefConfiguration
>

type NexusObjectConfiguration = {
  name: PrismaFieldName
  args?: Maybe<ArgsRecord>
  type: NexusNonNullDef<string> | NexusListDef<string> | NexusNullDef<string>
  description: string
}

type NexusObjectListConfiguration = {
  name: PrismaFieldName
  type: NexusNonNullDef<string> | NexusListDef<string> | NexusNullDef<string>
  description?: string
  list: NexusNonNullDef<NexusListDef<NexusNonNullDef<string>>>
  total: NexusNonNullDef<'Int'>
  hasMore: NexusNonNullDef<'Boolean'>
}

type NexusQueryConfiguration = {
  name: PrismaFieldName
  args?: Maybe<ArgsRecord>
  type: NexusNonNullDef<string> | NexusListDef<string> | NexusNullDef<string>
  description?: string
  resolve: Resolver
}

type NexusInputConfiguration =
  | {
      name: PrismaFieldName
    }
  | {
      name: PrismaFieldName
      // eslint-disable-next-line
      AND: { name: string; type: NexusListDef<NexusNonNullDef<any>> }
      // eslint-disable-next-line
      OR: { name: string; type: NexusListDef<NexusNonNullDef<any>> }
      // eslint-disable-next-line
      NOT: { name: string; type: NexusListDef<NexusNonNullDef<any>> }
    }

type NexusObjectTypeDefConfiguration = Record<
  PrismaModelFieldNameOrMetadataFieldName,
  | NexusObjectConfiguration
  | NexusQueryConfiguration
  | NexusInputConfiguration
  | NexusObjectListConfiguration
  // Metadata fields can be any of these
  | string
  | undefined
>

type NexusObjectListTypeDefConfiguration = {
  $name: string
  list: NexusNonNullDef<NexusListDef<NexusNonNullDef<string>>>
  total: NexusNonNullDef<'Int'>
  hasMore: NexusNonNullDef<'Boolean'>
}

/**
 * Create Nexus object type definition configurations for Prisma models found in the given DMMF.
 */
const createNexusObjectTypeDefConfigurations = (
  dmmf: DMMF.Document,
  settings: Settings,
): NexusObjectTypeDefConfigurations => {
  return {
    ...chain(dmmf.datamodel.models)
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
      .value(),
    Query: createNexusQueryTypeDefConfiguration(dmmf, settings),
  }
}

const createNexusQueryTypeDefConfiguration = (
  dmmf: DMMF.Document,
  settings: Settings,
): NexusObjectTypeDefConfiguration => {
  const configuration: NexusObjectTypeDefConfiguration = {
    $name: 'Query',
    $description: 'The root query type which gives access points into the data universe.',
  }

  chain(dmmf.datamodel.models)
    .forEach((model) => {
      const findUniqueName = camelCase(model.name)
      const findManyName = camelCase(model.name) + 's'
      configuration[findUniqueName] = {
        name: findUniqueName,
        type: Nexus.nonNull(model.name),
        args: {
          where: Nexus.nonNull(`${model.name}WhereUniqueInput`),
        },
        resolve: nexusResolverFromPrismaFindUnique(model, settings),
      }

      configuration[findManyName] = {
        name: findManyName,
        type: Nexus.nonNull(
          Nexus.objectType({
            name: `${model.name}s`,
            definition(t) {
              t.nonNull.list.nonNull.field('list', {
                type: model.name,
              })
              t.nonNull.int('total')
              t.nonNull.boolean('hasMore')
            },
          }),
        ),
        args: {
          where: `${model.name}WhereInput`,
          take: 'Int',
          skip: 'Int',
        },
        resolve: nexusResolverFromPrismaFindMany(model, settings),
      }
    })
    .value()

  return configuration
}

const inputFieldAliases: Record<string, Record<string, string>> = {}

const addInputFieldAlias = (inputTypeName: string, fieldName: string, alias: string) => {
  inputFieldAliases[inputTypeName] = {
    ...inputFieldAliases[alias],
    [alias]: fieldName,
  }
}

const createNexusInputTypeDefConfigurations = (
  dmmf: DMMF.Document,
  settings: Settings,
): NexusObjectTypeDefConfigurations => {
  return {
    ...chain(dmmf.datamodel.models)
      .map((model) => {
        const uniqueFields = PrismaUtils.getAllUniqueIdentifierFields(model)
        const inputTypeName = `${model.name}WhereUniqueInput`
        return {
          $name: inputTypeName,
          ...chain(Object.keys(uniqueFields))
            .map((fieldName) => {
              const field = uniqueFields[fieldName]
              if (field) {
                if (Array.isArray(field)) {
                  const createFieldConfig = (name: string) => ({
                    name,
                    type: Nexus.inputObjectType({
                      name: `${model.name}_${fieldName}_UniqueInput`,
                      definition(t) {
                        field.forEach((f) => {
                          const graphqlType = fieldTypeToGraphQLType(f, settings.gentime)
                          if (graphqlType) {
                            t.field(f.name, {
                              type: graphqlType,
                            })
                          }
                        })
                      },
                    }),
                  })
                  return {
                    as: (alias: string) => {
                      addInputFieldAlias(inputTypeName, fieldName, alias)
                      return createFieldConfig(alias)
                    },
                    ...createFieldConfig(fieldName),
                  }
                } else {
                  const graphqlType = fieldTypeToGraphQLType(field, settings.gentime)
                  if (graphqlType) {
                    return {
                      as: (alias: string) => {
                        addInputFieldAlias(inputTypeName, fieldName, alias)
                        return {
                          name: alias,
                          type: graphqlType,
                        }
                      },
                      name: fieldName,
                      type: graphqlType,
                    }
                  }
                }
              }
              return null
            })
            .keyBy('name')
            .value(),
        }
      })
      .keyBy('$name')
      .value(),
    ...chain(dmmf.datamodel.models)
      .map((model) => {
        const inputTypeName = `${model.name}WhereInput`
        return {
          $name: inputTypeName,
          AND: {
            name: 'AND',
            type: Nexus.list(Nexus.nonNull(inputTypeName)),
          },
          OR: {
            name: 'OR',
            type: Nexus.list(Nexus.nonNull(inputTypeName)),
          },
          NOT: {
            name: 'NOT',
            type: Nexus.list(Nexus.nonNull(inputTypeName)),
          },
          ...chain(model.fields)
            .map((field) => {
              switch (field.kind) {
                case 'scalar': {
                  const scalarType = fieldTypeToGraphQLType(field, settings.gentime)
                  const typeName = `${scalarType}Filter`
                  let graphqlType = inputTypes.find((type) => {
                    return type.name === typeName
                  })
                  if (!graphqlType) {
                    graphqlType = createNexusScalarFilterType(scalarType, field.type)
                    if (graphqlType) {
                      inputTypes.push(graphqlType)
                    }
                  }
                  if (graphqlType) {
                    return {
                      as: (alias: string) => {
                        addInputFieldAlias(inputTypeName, field.name, alias)
                        return {
                          name: alias,
                          type: graphqlType,
                        }
                      },
                      name: field.name,
                      type: graphqlType,
                    }
                  }
                  break
                }
                case 'enum': {
                  const enumType = fieldTypeToGraphQLType(field, settings.gentime)
                  const typeName = `${enumType}Filter`
                  let graphqlType = inputTypes.find((type) => {
                    return type.name === typeName
                  })
                  if (!graphqlType) {
                    graphqlType = createNexusEnumFilterType(enumType)
                    if (graphqlType) {
                      inputTypes.push(graphqlType)
                    }
                  }
                  return {
                    as: (alias: string) => {
                      addInputFieldAlias(inputTypeName, field.name, alias)
                      return {
                        name: alias,
                        type: graphqlType,
                      }
                    },
                    name: field.name,
                    type: graphqlType,
                  }
                }
                case 'object': {
                  const objectType = fieldTypeToGraphQLType(field, settings.gentime)
                  if (field.isList) {
                    const typeName = `${objectType}ListFilter`
                    let graphqlType = inputTypes.find((type) => {
                      return type.name === typeName
                    })
                    if (!graphqlType) {
                      graphqlType = createNexusObjectListFilterType(objectType)
                      if (graphqlType) {
                        inputTypes.push(graphqlType)
                      }
                    }
                    return {
                      as: (alias: string) => {
                        addInputFieldAlias(inputTypeName, field.name, alias)
                        return {
                          name: alias,
                          type: graphqlType,
                        }
                      },
                      name: field.name,
                      type: graphqlType,
                    }
                  } else {
                    const typeName = `${objectType}WhereInput`
                    return {
                      as: (alias: string) => {
                        addInputFieldAlias(inputTypeName, field.name, alias)
                        return {
                          name: alias,
                          type: typeName,
                        }
                      },
                      name: field.name,
                      type: typeName,
                    }
                  }
                }
              }
              return null
            })
            .keyBy('name')
            .value(),
        }
      })
      .keyBy('$name')
      .value(),
  }
}

const inputTypes: NexusInputObjectTypeDef<string>[] = []
// eslint-disable-next-line
const enumTypes: NexusEnumTypeDef<any>[] = []

const createNexusScalarFilterType = (
  scalarType: string,
  fieldType: string,
): NexusInputObjectTypeDef<string> | undefined => {
  switch (scalarType) {
    case StandardGraphQLScalarTypes.ID: {
      if (fieldType === 'String' || fieldType === 'Int') {
        return createNexusIDFilterType(fieldType)
      }
      break
    }
    case StandardGraphQLScalarTypes.String: {
      return createNexusStringFilterType()
    }
    case StandardGraphQLScalarTypes.Boolean: {
      return createNexusBooleanFilterType()
    }
    case StandardGraphQLScalarTypes.Int:
    case StandardGraphQLScalarTypes.Float:
    case 'BigInt':
    case 'Decimal':
    case 'DateTime': {
      return createNexusNumberFilterType(scalarType)
    }
    case 'Json': {
      return createNexusJsonFilterType()
    }
    case 'Bytes': {
      return createNexusBytesFilterType()
    }
  }
  return undefined
}

const createNexusEnumFilterType = (enumType: string): NexusInputObjectTypeDef<string> => {
  const typeName = `${enumType}Filter`
  return Nexus.inputObjectType({
    name: typeName,
    definition(t) {
      defineNexusBytesFilter(t, enumType)
      t.field('not', {
        type: typeName,
      })
    },
  })
}

const createNexusObjectListFilterType = (objectType: string): NexusInputObjectTypeDef<string> => {
  const typeName = `${objectType}ListFilter`
  const objectTypeWhere = `${objectType}WhereInput`
  return Nexus.inputObjectType({
    name: typeName,
    definition(t) {
      t.field('every', {
        type: objectTypeWhere,
      })
      t.field('some', {
        type: objectTypeWhere,
      })
      t.field('none', {
        type: objectTypeWhere,
      })
    },
  })
}

const createNexusIDFilterType = (fieldType: 'String' | 'Int'): NexusInputObjectTypeDef<string> => {
  const scalarType = 'ID'
  const typeName = `${fieldType}${scalarType}Filter`

  return Nexus.inputObjectType({
    name: typeName,
    definition(t) {
      if (fieldType === 'String') {
        defineNexusValueFilter(t, scalarType)
        defineNexusTextFilter(t, scalarType)
      } else {
        defineNexusValueFilter(t, scalarType)
        defineNexusBytesFilter(t, scalarType)
      }
      t.field('not', {
        type: typeName,
      })
    },
  })
}

const createNexusStringFilterType = (): NexusInputObjectTypeDef<string> => {
  const scalarType = 'String'
  const typeName = `${scalarType}Filter`
  const nestedTypeName = `Nested${typeName}`

  return Nexus.inputObjectType({
    name: typeName,
    definition(t) {
      let queryModeType = enumTypes.find((type) => {
        return type.name === 'StringFilterQueryMode'
      })
      if (!queryModeType) {
        queryModeType = createQueryModeType()
        enumTypes.push(queryModeType)
      }
      let nestedFilterType = inputTypes.find((type) => {
        return type.name === nestedTypeName
      })
      if (!nestedFilterType) {
        nestedFilterType = createNexusNestedStringFilterType()
        inputTypes.push(nestedFilterType)
      }

      defineNexusValueFilter(t, scalarType)
      defineNexusTextFilter(t, scalarType)
      t.field('mode', {
        type: queryModeType,
      })
      t.field('not', {
        type: nestedFilterType,
      })
    },
  })
}

const createNexusNestedStringFilterType = (): NexusInputObjectTypeDef<string> => {
  const scalarType = 'String'
  const typeName = `Nested${scalarType}Filter`

  return Nexus.inputObjectType({
    name: typeName,
    definition(t) {
      defineNexusValueFilter(t, scalarType)
      defineNexusTextFilter(t, scalarType)
      t.field('not', {
        type: typeName,
      })
    },
  })
}

const createQueryModeType = (): NexusEnumTypeDef<'StringFilterQueryMode'> => {
  return Nexus.enumType({
    name: 'StringFilterQueryMode',
    members: ['default', 'insensitive'],
  })
}

const createNexusNumberFilterType = (
  scalarType: 'Int' | 'Boolean' | 'Float' | 'BigInt' | 'DateTime' | 'Decimal',
): NexusInputObjectTypeDef<string> => {
  const typeName = `${scalarType}Filter`

  return Nexus.inputObjectType({
    name: typeName,
    definition(t) {
      defineNexusValueFilter(t, scalarType)
      defineNexusBytesFilter(t, scalarType)
      t.field('not', {
        type: typeName,
      })
    },
  })
}

const createNexusBooleanFilterType = (): NexusInputObjectTypeDef<string> => {
  const scalarType = 'String'
  const typeName = `${scalarType}Filter`

  return Nexus.inputObjectType({
    name: typeName,
    definition(t) {
      defineNexusBaseFilter(t, scalarType)
      t.field('not', {
        type: typeName,
      })
    },
  })
}

const createNexusBytesFilterType = (): NexusInputObjectTypeDef<string> => {
  const scalarType = 'String'
  const typeName = `${scalarType}Filter`

  return Nexus.inputObjectType({
    name: typeName,
    definition(t) {
      defineNexusBytesFilter(t, scalarType)
      t.field('not', {
        type: typeName,
      })
    },
  })
}

const createNexusJsonFilterType = (): NexusInputObjectTypeDef<string> => {
  const scalarType = 'Json'
  const typeName = `${scalarType}Filter`

  return Nexus.inputObjectType({
    name: typeName,
    definition(t) {
      defineNexusValueFilter(t, scalarType)
      t.list.nonNull.string('path')
      t.string('string_starts_with')
      t.string('string_ends_with')
      t.field('array_contains', {
        type: scalarType,
      })
      t.field('array_starts_with', {
        type: scalarType,
      })
      t.field('array_ends_with', {
        type: scalarType,
      })
      t.field('not', {
        type: typeName,
      })
    },
  })
}

const defineNexusTextFilter = (t: Nexus.blocks.InputDefinitionBlock<string>, scalarType: 'ID' | 'String') => {
  defineNexusBytesFilter(t, scalarType)
  t.field('contains', {
    type: scalarType,
  })
  t.field('endsWith', {
    type: scalarType,
  })
  t.field('startsWith', {
    type: scalarType,
  })
}

const defineNexusBaseFilter = (
  t: Nexus.blocks.InputDefinitionBlock<string>,
  scalarType: Omit<StandardGraphQLScalarType, 'ID'> | 'BigInt' | 'DateTime' | 'Json' | 'Bytes' | 'Decimal',
) => {
  const type = scalarType as string
  t.field('equals', {
    type,
  })
}

const defineNexusBytesFilter = (
  t: Nexus.blocks.InputDefinitionBlock<string>,
  scalarType:
    | Omit<StandardGraphQLScalarType, 'ID' | 'Boolean'>
    | 'BigInt'
    | 'DateTime'
    | 'Json'
    | 'Bytes'
    | 'Decimal',
) => {
  const type = scalarType as string
  defineNexusBaseFilter(t, type)
  t.field('in', {
    type: Nexus.list(Nexus.nonNull(type)),
  })
  t.field('notIn', {
    type: Nexus.list(Nexus.nonNull(type)),
  })
}

const defineNexusValueFilter = (
  t: Nexus.blocks.InputDefinitionBlock<string>,
  scalarType:
    | Omit<StandardGraphQLScalarType, 'ID' | 'Boolean'>
    | 'BigInt'
    | 'DateTime'
    | 'Json'
    | 'Bytes'
    | 'Decimal',
) => {
  const type = scalarType as string
  defineNexusBaseFilter(t, type)
  t.field('gt', {
    type,
  })
  t.field('gte', {
    type,
  })
  t.field('lt', {
    type,
  })
  t.field('lte', {
    type,
  })
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

  return async (
    source: RecordUnknown,
    args: RecordUnknown,
    ctx: RecordUnknown,
    info: GraphQLResolveInfo,
  ): Promise<unknown> => {
    const whereUnique = createWhereUniqueInput(source, model)

    // eslint-disable-next-line
    const prismaModel = getPrismaModel(model, ctx, settings)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof prismaModel.findUnique !== 'function') {
      // TODO rich errors
      throw new Error(`The prisma model ${model.name} does not have a findUnique method available.`)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const findUnique = prismaModel.findUnique as (query: unknown) => MaybePromise<unknown>
    const result = findUnique({
      where: whereUnique,
    })

    const { where, take, skip } = mapArgs(info, args)

    const { returnType } = info

    const returnTypeFields = getFieldsFromGqlType(returnType)

    if ('list' in returnTypeFields) {
      const res = (await findUnique({
        where: whereUnique,
        select: {
          _count: {
            select: {
              [field.name]: {
                where,
              },
            },
          },
          [field.name]: {
            take,
            skip,
            where,
          },
        },
      })) as {
        _count: {
          [key: string]: number
        }
        [key: string]: unknown
      } | null
      const list = res ? res[field.name] : []
      let total = 0
      if (res) {
        total = res._count[field.name] || 0
      }
      let hasMore = false
      if (take) {
        hasMore = total > take + (skip || 0)
      }
      return {
        list,
        total,
        hasMore,
      }
    } else {
      // @ts-expect-error Only known at runtime
      // eslint-disable-next-line
      return result[field.name]({
        where,
      })
    }
  }
}

const getFieldsFromGqlType = (
  gqlType: GraphQLType | undefined,
  // eslint-disable-next-line
): GraphQLInputFieldMap | GraphQLFieldMap<any, any> => {
  if (gqlType) {
    if (gqlType instanceof GraphQLInputObjectType || gqlType instanceof GraphQLObjectType) {
      return gqlType.getFields()
    } else if ('ofType' in gqlType) {
      return getFieldsFromGqlType(gqlType.ofType)
    }
  }
  return {}
}

const getNameFromGqlInputType = (gqlInputType: GraphQLInputType): string | undefined => {
  if ('name' in gqlInputType) {
    return gqlInputType.name
  }
  return getNameFromGqlInputType(gqlInputType.ofType)
}

const mapInputs = (schema: GraphQLSchema, typeName: string, input: Record<string, unknown>) => {
  const fieldAliases = inputFieldAliases[typeName]
  if (fieldAliases && input && typeof input === 'object') {
    Object.keys(input).forEach((fieldName) => {
      const field = input[fieldName] as Record<string, unknown> | Record<string, unknown>[]
      if (field && typeof field === 'object') {
        const gqlType = schema.getType(typeName)
        const gqlField = getFieldsFromGqlType(gqlType)[fieldName]
        if (gqlField) {
          const gqlFieldName = getNameFromGqlInputType(gqlField.type as GraphQLInputType)
          if (gqlFieldName) {
            if (Array.isArray(field)) {
              field.forEach((f) => {
                mapInputs(schema, gqlFieldName, f)
              })
            } else {
              mapInputs(schema, gqlFieldName, field)
            }
          }
        }
      }
      const alias = fieldAliases[fieldName]
      if (alias && alias !== fieldName) {
        input[alias] = input[fieldName]
        delete input[fieldName]
      }
    })
  }
}

const mapArgs = (info: GraphQLResolveInfo, args: RecordUnknown) => {
  const where = args.where ? (args.where as Record<string, unknown>) : undefined

  const { schema, fieldName } = info

  const queryFields = schema.getQueryType()?.getFields()
  const queryField = queryFields ? queryFields[fieldName] : undefined

  if (queryField) {
    queryField.args.forEach((arg) => {
      const argName = arg.name
      let argType = arg.type
      if (argType instanceof GraphQLNonNull) {
        argType = argType.ofType
      }
      const argTypeName = 'name' in argType ? argType.name : undefined
      if (argName === 'where' && where && argTypeName) {
        mapInputs(schema, argTypeName, where)
      }
    })
  }

  return {
    where,
    take: args.take ? (args.take as number) : undefined,
    skip: args.skip ? (args.skip as number) : undefined,
  }
}

export const nexusResolverFromPrismaFindUnique = (model: DMMF.Model, settings: Settings): Resolver => {
  return (
    _source: RecordUnknown,
    args: RecordUnknown,
    ctx: RecordUnknown,
    info: GraphQLResolveInfo,
  ): MaybePromise<unknown> => {
    // eslint-disable-next-line
    const prismaModel = getPrismaModel(model, ctx, settings)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof prismaModel.findUnique !== 'function') {
      // TODO rich errors
      throw new Error(`The prisma model ${model.name} does not have a findUnique method available.`)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const findUnique = prismaModel.findUnique as (query: unknown) => MaybePromise<unknown>

    const { where } = mapArgs(info, args)

    return findUnique({
      where,
    })
  }
}

export const nexusResolverFromPrismaFindMany = (model: DMMF.Model, settings: Settings): Resolver => {
  return async (
    _source: RecordUnknown,
    args: RecordUnknown,
    ctx: RecordUnknown,
    info: GraphQLResolveInfo,
  ): Promise<unknown> => {
    // eslint-disable-next-line
    const prismaModel = getPrismaModel(model, ctx, settings)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof prismaModel.findMany !== 'function') {
      // TODO rich errors
      throw new Error(`The prisma model ${model.name} does not have a findMany method available.`)
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof prismaModel.count !== 'function') {
      // TODO rich errors
      throw new Error(`The prisma model ${model.name} does not have a count method available.`)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const findMany = prismaModel.findMany as (query: unknown) => Promise<unknown>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const count = prismaModel.count as (query: unknown) => Promise<number>

    const { where, take, skip } = mapArgs(info, args)

    const findManyQuery = findMany({
      where,
      take,
      skip,
    }) as Promise<Array<unknown>>

    // eslint-disable-next-line
    const prisma: any = ctx[settings.runtime.data.prismaClientContextField]

    if (take || skip) {
      // Use transaction to ensure we get the total count and the list in a single database call
      // eslint-disable-next-line
      const [list, total] = (await prisma.$transaction([findManyQuery, count({ where })])) as [
        Array<unknown>,
        number,
      ]
      let hasMore = false
      if (take) {
        hasMore = total > take + (skip || 0)
      }
      return {
        list,
        total,
        hasMore,
      }
    }

    const list = await findManyQuery
    return {
      list,
      total: list.length,
      hasMore: false,
    }
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
