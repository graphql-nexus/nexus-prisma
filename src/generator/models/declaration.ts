import { DMMF } from '@prisma/generator-helper'
import dedent from 'dindist'
import * as OS from 'os'
import { LiteralUnion } from 'type-fest'
import { StandardGraphQLScalarType, StandardGraphQLScalarTypes } from '../../helpers/graphql'
import { PrismaScalarType } from '../../helpers/prisma'
import { allCasesHandled } from '../../helpers/utils'
import { PrismaDmmf } from '../../lib/prisma-dmmf'
import { Gentime } from '../gentime/settingsSingleton'
import { jsDocForEnum, jsDocForField, jsDocForModel } from '../helpers/JSDocTemplates'
import { ModuleSpec } from '../types'

export const createModuleSpec = (dmmf: DMMF.Document, settings: Gentime.Settings): ModuleSpec => {
  return {
    fileName: 'index.d.ts',
    content: dedent`
      ${renderTypeScriptDeclarationForDocumentModels(dmmf, settings)}
    `,
  }
}

const NO_ENUMS_DEFINED_COMMENT = dedent`
  // N/A –– You have not defined any enums in your Prisma schema file.
`

const NO_MODELS_DEFINED_COMMENT = dedent`
  // N/A –– You have not defined any models in your Prisma schema file.
`

export function renderTypeScriptDeclarationForDocumentModels(
  dmmf: DMMF.Document,
  settings: Gentime.Settings
): string {
  const models = dmmf.datamodel.models
  const enums = dmmf.datamodel.enums

  return (
    dedent`
      import * as NexusCore from 'nexus/dist/core'

      //
      //
      // TYPES
      // TYPES
      // TYPES
      // TYPES
      //
      //

      // Models

      ${
        models.length === 0
          ? NO_MODELS_DEFINED_COMMENT
          : models.map((model) => renderTypeScriptDeclarationForModel(model, settings)).join('\n\n')
      }

      // Enums

      ${
        enums.length === 0
          ? NO_ENUMS_DEFINED_COMMENT
          : enums.map((enum_) => renderTypeScriptDeclarationForEnum(enum_, settings)).join('\n\n')
      }


      //
      //
      // TERMS
      // TERMS
      // TERMS
      // TERMS
      //
      //

      //
      //
      // EXPORTS: PRISMA MODELS
      // EXPORTS: PRISMA MODELS
      // EXPORTS: PRISMA MODELS
      // EXPORTS: PRISMA MODELS
      //
      //

      ${
        models.length === 0
          ? NO_MODELS_DEFINED_COMMENT
          : models
              .map((model) => {
                return dedent`
                  export const ${model.name}: ${model.name}
                `
              })
              .join('\n\n')
      }

      //
      //
      // EXPORTS: PRISMA ENUMS
      // EXPORTS: PRISMA ENUMS
      // EXPORTS: PRISMA ENUMS
      // EXPORTS: PRISMA ENUMS
      //
      //

      ${
        enums.length === 0
          ? NO_ENUMS_DEFINED_COMMENT
          : enums
              .map((enum_) => {
                return dedent`
                  export const ${enum_.name}: ${enum_.name}
                `
              })
              .join('\n\n')
      }

      //
      //
      // EXPORTS: OTHER
      // EXPORTS: OTHER
      // EXPORTS: OTHER
      // EXPORTS: OTHER
      //
      //

      import { Runtime } from ${
        settings.data.output.directory === 'default'
          ? `'../generator/runtime/settingsSingleton'`
          : `'nexus-prisma/dist-cjs/generator/runtime/settingsSingleton'`
      }

      /**
       * Adjust Nexus Prisma's [runtime settings](https://pris.ly/nexus-prisma/docs/settings/runtime).
       *
       * @example
       *
       *     import { PrismaClient } from '@prisma/client'
       *     import { ApolloServer } from 'apollo-server'
       *     import { makeSchema } from 'nexus'
       *     import { User, Post, $settings } from 'nexus-prisma'
       *
       *     new ApolloServer({
       *       schema: makeSchema({
       *         types: [],
       *       }),
       *       context() {
       *         return {
       *           db: new PrismaClient(), // <-- You put Prisma client on the "db" context property
       *         }
       *       },
       *     })
       *
       *     $settings({
       *       prismaClientContextField: 'db', // <-- Tell Nexus Prisma
       *     })
       *
       * @remarks This is _different_ than Nexus Prisma's [_gentime_ settings](https://pris.ly/nexus-prisma/docs/settings/gentime).
       */
      export const $settings: typeof Runtime.changeSettings
    ` + OS.EOL
  )
}

function renderTypeScriptDeclarationForEnum(enum_: DMMF.DatamodelEnum, settings: Gentime.Settings): string {
  const jsdoc = settings.data.docPropagation.JSDoc ? jsDocForEnum({ enum: enum_, settings }) + '\n' : ''
  const description = renderPrismaNodeDocumentationToDescription({ settings, node: enum_ })

  return dedent`
    ${jsdoc}export interface ${enum_.name} {
      name: '${enum_.name}'
      description: ${description}
      members: [${enum_.values.map((value) => `'${value.name}'`).join(', ')}]
    }
  `
}

function renderTypeScriptDeclarationForModel(model: DMMF.Model, settings: Gentime.Settings): string {
  const jsdoc = settings.data.docPropagation.JSDoc ? jsDocForModel({ model, settings }) + '\n' : ''
  const description = renderPrismaNodeDocumentationToDescription({ settings, node: model })

  return dedent`
    ${jsdoc}export interface ${model.name} {
      $name: '${model.name}'
      $description: ${description}
      ${renderTypeScriptDeclarationForModelFields(model, settings)}
    }
  `
}

const renderPrismaNodeDocumentationToDescription = (params: {
  settings: Gentime.Settings
  node: PrismaDmmf.DocumentableNode
}): string => {
  return `${
    params.node.documentation && params.settings.data.docPropagation.GraphQLDocs ? `string` : `undefined`
  }`
}

function renderTypeScriptDeclarationForModelFields(model: DMMF.Model, settings: Gentime.Settings): string {
  return model.fields
    .map((field) => renderTypeScriptDeclarationForField({ field, model, settings }))
    .join('\n')
}

function renderTypeScriptDeclarationForField({
  field,
  model,
  settings,
}: {
  field: DMMF.Field
  model: DMMF.Model
  settings: Gentime.Settings
}): string {
  const jsdoc = settings.data.docPropagation.JSDoc ? jsDocForField({ field, model, settings }) + '\n' : ''
  const description = renderPrismaNodeDocumentationToDescription({ settings, node: field })
  return dedent`
    ${jsdoc}${field.name}: {
      /**
       * The name of this field.
       */
      name: '${field.name}'

      /**
       * The type of this field.
       */
      type: ${renderNexusType(field, settings)}

      /**
       * The documentation of this field.
       */
      description: ${description}

      /**
       * The resolver of this field
       */
      resolve: NexusCore.FieldResolver<'${model.name}', '${field.name}'>
    }
  `
}

function renderNexusType(field: DMMF.Field, settings: Gentime.Settings): string {
  const graphqlType = fieldTypeToGraphQLType(field, settings.data)
  /**
   * Relation fields can only work if the related field has been added to the API.
   * If it has not, then Nexus will not "know" about it meaning it won't be valid
   * within NexusCore.NexusNonNullDef<'...'> etc.
   *
   * Example:
   *
   *     model Foo {
   *       bar Bar
   *     }
   *
   *     model Bar {
   *       ...
   *     }
   *
   * `nexus-prisma` Foo.bar would not work unless the developer has put `Bar` into their API as well.
   *
   * Meanwhile, in the generated `nexus-prisma` types, to avoid static type errors, we must guard against the
   * generated types to not _assume_ that `Bar` etc. has been put into the API.
   *
   * Thus, we use TS conditional types. We look to see if Nexus typegen has this type.
   */
  const typeLiteralMissingNexusOutputTypeErrorMessage = `'Warning/Error: The type \\'${graphqlType}\\' is not amoung the union of GetGen<\\'allNamedTypes\\', string>. This means that either: 1) You need to run nexus typegen reflection. 2) You need to add the type \\'${graphqlType}\\' to your GraphQL API.'`
  const conditionalTypeCheck = `'${graphqlType}' extends NexusCore.GetGen<'allNamedTypes', string>`

  if (field.isList && field.isRequired) {
    return dedent`
      ${conditionalTypeCheck}
        ? (NexusCore.NexusListDef<'${graphqlType}'> | NexusCore.NexusNonNullDef<'${graphqlType}'>)
        : ${typeLiteralMissingNexusOutputTypeErrorMessage}
    `
  } else if (field.isList && !field.isRequired) {
    return dedent`
      ${conditionalTypeCheck}
        ? NexusCore.NexusListDef<'${graphqlType}'> | NexusCore.NexusNullDef<'${graphqlType}'>
        : ${typeLiteralMissingNexusOutputTypeErrorMessage}

    `
  } else if (field.isRequired) {
    return dedent`
      ${conditionalTypeCheck}
        ? NexusCore.NexusNonNullDef<'${graphqlType}'>
        : ${typeLiteralMissingNexusOutputTypeErrorMessage}

    `
  } else {
    return dedent`
      ${conditionalTypeCheck}
        ? NexusCore.NexusNullDef<'${graphqlType}'>
        : ${typeLiteralMissingNexusOutputTypeErrorMessage}

    `
  }
}

/**
 * Map the fields type to a GraphQL type.
 *
 * @remarks The `settings` param type uses settings data instead of Setset instance because this helper
 *          is used at runtime too where we don't have a Setset instance for gentime.
 */
export function fieldTypeToGraphQLType(
  field: DMMF.Field,
  settings: Gentime.SettingsData
): LiteralUnion<StandardGraphQLScalarType, string> {
  // TODO remove once PC is fixed https://prisma-company.slack.com/archives/C016KUHB1R6/p1638816683155000?thread_ts=1638563060.145800&cid=C016KUHB1R6
  if (typeof field.type !== 'string') {
    throw new TypeError(`field.type is supposed to always be a string.`)
  }

  switch (field.kind) {
    case 'scalar': {
      if (field.isId) {
        if (field.type === 'String' || (field.type === 'Int' && settings.projectIdIntToGraphQL === 'ID')) {
          return StandardGraphQLScalarTypes.ID
        }
      }

      const fieldType = field.type as PrismaScalarType

      switch (fieldType) {
        case 'String': {
          return StandardGraphQLScalarTypes.String
        }
        case 'Int': {
          return StandardGraphQLScalarTypes.Int
        }
        case 'Boolean': {
          return StandardGraphQLScalarTypes.Boolean
        }
        case 'Float': {
          return StandardGraphQLScalarTypes.Float
        }
        case 'BigInt': {
          return 'BigInt'
        }
        case 'DateTime': {
          return 'DateTime'
        }
        case 'Json': {
          return 'Json'
        }
        case 'Bytes': {
          return 'Bytes'
        }
        case 'Decimal': {
          return 'Decimal'
        }
        default: {
          return allCasesHandled(fieldType)
        }
      }
    }
    case 'enum': {
      return field.type
    }
    case 'object': {
      return field.type
    }
    case 'unsupported': {
      return field.type
    }
    default:
      allCasesHandled(field.kind)
  }
}
