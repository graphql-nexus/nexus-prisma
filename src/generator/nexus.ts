import { DMMF } from '@prisma/client/runtime'
import endent from 'endent'
import * as fs from 'fs-jetpack'
import * as OS from 'os'
import { GeneratedModule } from './types'

/** Transform the given DMMF into TS source code. */
export function generateRuntimeNexusSource(dmmf: DMMF.Document): GeneratedModule {
  if (process.env.NP_DEBUG) {
    fs.write('dmmf.json', dmmf)
  }

  const content = endent`
    import * as Nexus from 'nexus'

    ${dmmf.datamodel.models.map(modelToTypeScriptSource).join(OS.EOL + OS.EOL)}
  `

  return {
    fileName: 'nexus.ts',
    content,
  }
}

/** Transform a DMMF model into TS source code. */
function modelToTypeScriptSource(model: DMMF.Model): string {
  return endent`

    export const ${model.name} = {
      ${model.fields.filter(isSupportedType).map(fieldToTypeScriptSource).join(`,${OS.EOL}`)},
    } as const
  `
}

/**
 * Transform a DMMF model _field_ into TS source code.
 *
 * @example
 *   // Example of field data given:
 *   const field = {
 *     name: 'f16',
 *     kind: 'scalar',
 *     isList: false,
 *     isRequired: true,
 *     isUnique: false,
 *     isId: false,
 *     isReadOnly: false,
 *     type: 'DateTime',
 *     hasDefaultValue: false,
 *     isGenerated: false,
 *     isUpdatedAt: false,
 *   }
 */
function fieldToTypeScriptSource(field: DMMF.Field) {
  return endent`
    ${field.name}: {
      name: '${field.name}',
      config: {
        type: ${renderType(field)},
      }
    }
  `
}

function renderType(field: DMMF.Field): string {
  const graphqlType = getGraphQLType(field)

  if (field.isList) {
    return endent`
      Nexus.nonNull(Nexus.list(Nexus.nonNull(${quote(graphqlType)})))
    `
  } else if (field.isRequired) {
    return endent`
      Nexus.nonNull(${quote(graphqlType)})
    `
  } else {
    return endent`
      Nexus.nullable(${quote(graphqlType)})
    `
  }
}

type PrismaScalarType =
  | 'String'
  | 'Boolean'
  | 'Int'
  | 'BigInt'
  | 'Float'
  | 'Decimal'
  | 'DateTime'
  | 'Json'
  | 'Bytes'

function quote(x: string): string {
  return `'${x}'`
}

type GraphQLScalarType = 'ID' | 'String' | 'Int' | 'Float' | 'Boolean'

function isSupportedType(field: DMMF.Field): boolean {
  return field.kind === 'scalar'
}

function getGraphQLType(field: DMMF.Field): GraphQLScalarType {
  if (field.kind !== 'scalar') {
    throw new Error(`type mapping only supported for scalar-type fields`)
  }

  const typeName = field.type as PrismaScalarType

  switch (typeName) {
    case 'String': {
      if (field.isId) {
        return GraphQLScalarTypes.ID
      }
      return GraphQLScalarTypes.String
    }
    default: {
      return GraphQLScalarTypes.String
    }
  }
}

const GraphQLScalarTypes = {
  ID: 'ID',
  String: 'String',
} as const
