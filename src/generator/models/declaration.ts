import { DMMF } from '@prisma/generator-helper'
import endent from 'endent'
import { LiteralUnion } from 'type-fest'
import { StandardGraphQLScalarType, StandardgraphQLScalarTypes } from '../../helpers/graphql'
import { PrismaScalarType } from '../../helpers/prisma'
import { allCasesHandled } from '../../helpers/utils'
import { jsDocForField, jsDocForModel } from '../helpers/JSDocTemplates'
import { ModuleSpec } from '../types'

export function createModuleSpec(dmmf: DMMF.Document): ModuleSpec {
  return {
    fileName: 'index.d.ts',
    content: endent`
        ${renderTypeScriptDeclarationForDocumentModels(dmmf)}
      `,
  }
}

export function renderTypeScriptDeclarationForDocumentModels(dmmf: DMMF.Document): string {
  const models = dmmf.datamodel.models

  return endent`
    import * as Nexus from 'nexus'
    import * as NexusCore from 'nexus/dist/core'

    //
    // Types
    //

    namespace $Types {
      ${models.map(renderTypeScriptDeclarationForModel).join('\n\n')}
    }


    //
    // Exports
    //

    ${models
      .map((model) => {
        return endent`
          ${jsDocForModel(model)}
          export const ${model.name}: $Types.${model.name}
        `
      })
      .join('\n\n')}
  `
}

function renderTypeScriptDeclarationForModel(model: DMMF.Model): string {
  return endent`
    ${jsDocForModel(model)}
    interface ${model.name} {
      $name: '${model.name}'
      $description: ${model.documentation ? `'${model.documentation}'` : 'null'}
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

      switch (typeName) {
        case 'String': {
          if (field.isId) {
            return StandardgraphQLScalarTypes.ID
          }
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
          return StandardgraphQLScalarTypes.String
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
