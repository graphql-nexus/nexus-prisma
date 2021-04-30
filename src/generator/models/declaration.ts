import { DMMF } from '@prisma/generator-helper'
import endent from 'endent'
import { LiteralUnion } from 'type-fest'
import { StandardGraphQLScalarType, StandardgraphQLScalarTypes } from '../../helpers/graphql'
import { PrismaScalarType } from '../../helpers/prisma'
import { allCasesHandled } from '../../helpers/utils'
import { jsDocForEnum, jsDocForField, jsDocForModel } from '../helpers/JSDocTemplates'
import { ModuleSpec } from '../types'

export function createModuleSpec(dmmf: DMMF.Document): ModuleSpec {
  return {
    fileName: 'index.d.ts',
    content: endent`
        ${renderTypeScriptDeclarationForDocumentModels(dmmf)}
      `,
  }
}

const NO_ENUMS_DEFINED_COMMENT = endent`
  // N/A –– You have not defined any models in your Prisma schema file.
`

const NO_MODELS_DEFINED_COMMENT = endent`
  // N/A –– You have not defined any enums in your Prisma schema file.
`

export function renderTypeScriptDeclarationForDocumentModels(dmmf: DMMF.Document): string {
  const models = dmmf.datamodel.models
  const enums = dmmf.datamodel.enums

  return endent`
    import * as Nexus from 'nexus'
    import * as NexusCore from 'nexus/dist/core'

    //
    //
    // TYPES
    // TYPES
    // TYPES
    // TYPES
    //
    //

    declare namespace $Types {
      // Models

      ${
        models.length === 0
          ? NO_MODELS_DEFINED_COMMENT
          : models.map(renderTypeScriptDeclarationForModel).join('\n\n')
      }

      // Enums

      ${
        enums.length === 0
          ? NO_ENUMS_DEFINED_COMMENT
          : enums.map(renderTypeScriptDeclarationForEnum).join('\n\n')
      }
    }


    //
    //
    // EXPORTS
    // EXPORTS
    // EXPORTS
    // EXPORTS
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
              return endent`
                ${jsDocForModel(model)}
                export const ${model.name}: $Types.${model.name}
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
              return endent`
                ${jsDocForEnum(enum_)}
                export const ${enum_.name}: $Types.${enum_.name}
              `
            })
            .join('\n\n')
    }

  `
}

function renderTypeScriptDeclarationForEnum(enum_: DMMF.DatamodelEnum): string {
  return endent`
    ${jsDocForEnum(enum_)}
    interface ${enum_.name} {
      name: '${enum_.name}'
      description: ${enum_.documentation ? `'${enum_.documentation}'` : 'undefined'}
      members: [${enum_.values.map((value) => `'${value.name}'`).join(', ')}]
    }
  `
}

function renderTypeScriptDeclarationForModel(model: DMMF.Model): string {
  return endent`
    ${jsDocForModel(model)}
    interface ${model.name} {
      $name: '${model.name}'
      $description: ${model.documentation ? `'${model.documentation}'` : 'undefined'}
      ${renderTypeScriptDeclarationForModelFields(model)}
    }
  `
}

function renderTypeScriptDeclarationForModelFields(model: DMMF.Model): string {
  return model.fields.map((field) => renderTypeScriptDeclarationForField({ field, model })).join('\n')
}

function renderTypeScriptDeclarationForField({
  field,
  model,
}: {
  field: DMMF.Field
  model: DMMF.Model
}): string {
  return endent`
    ${jsDocForField({ field, model })}
    ${field.name}: {
      /**
       * The name of this field.
       */
      name: '${field.name}'

      /**
       * The type of this field.
       */
      type: ${renderNexusType2(field)}

      /**
       * The documentation of this field.
       */
      description: ${field.documentation ? `string` : `undefined`}

      /**
       * The resolver of this field
       */
      resolve: ${renderNexusResolve(model, field)}
    }
  `
}

function renderNexusType2(field: DMMF.Field): string {
  const graphqlType = fieldTypeToGraphQLType(field)

  if (field.isList && field.isRequired) {
    return endent`
      NexusCore.ListDef<${graphqlType}> | NexusCore.NexusNonNullDef<${graphqlType}>
    `
  } else if (field.isList && !field.isRequired) {
    return endent`
      NexusCore.ListDef<${graphqlType}> | NexusCore.NexusNullDef<${graphqlType}>
    `
  } else if (field.isRequired) {
    return endent`
      NexusCore.NexusNonNullDef<'${graphqlType}'>
    `
  } else {
    return endent`
      NexusCore.NexusNullDef<'${graphqlType}'>
    `
  }
}

/** Map the fields type to a GraphQL type */
export function fieldTypeToGraphQLType(field: DMMF.Field): LiteralUnion<StandardGraphQLScalarType, string> {
  const fieldKind = field.kind

  switch (fieldKind) {
    case 'scalar': {
      const typeName = field.type as PrismaScalarType

      // TODO Allow user to configure this. Maybe some users want Prisma `Int @id` to be GraphQL `ID`.
      if (field.isId && field.type === 'String') {
        return StandardgraphQLScalarTypes.ID
      }

      switch (typeName) {
        case 'String': {
          return StandardgraphQLScalarTypes.String
        }
        case 'Int': {
          return StandardgraphQLScalarTypes.Int
        }
        case 'Boolean': {
          return StandardgraphQLScalarTypes.Boolean
        }
        case 'Float': {
          return StandardgraphQLScalarTypes.Float
        }
        case 'BigInt': {
          return StandardgraphQLScalarTypes.String
        }
        case 'DateTime': {
          return 'DateTime'
        }
        case 'Json': {
          return 'Json'
        }
        case 'Bytes': {
          return StandardgraphQLScalarTypes.String
        }
        case 'Decimal': {
          return StandardgraphQLScalarTypes.String
        }
        default: {
          return allCasesHandled(typeName)
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
      allCasesHandled(fieldKind)
  }
}

function renderNexusResolve(model: DMMF.Model, field: DMMF.Field): string {
  if (field.kind === 'object') {
    return endent`
      NexusCore.FieldResolver<'${model.name}', '${field.name}'>
    `
  } else return 'undefined'
}
