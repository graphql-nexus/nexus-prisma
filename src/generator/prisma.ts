import { DMMF } from '@prisma/client/runtime'
import endent from 'endent'
import * as OS from 'os'
import { GeneratedModule } from './types'

/** Transform the given DMMF into TS source code. */
export function generateRuntimePrismaSource(dmmf: DMMF.Document): GeneratedModule {
  const content = dmmf.datamodel.models.map(modelToTypeScriptSource).join(OS.EOL + OS.EOL)

  return {
    fileName: 'prisma.ts',
    content,
  }
}

/** Transform a DMMF model into TS source code. */
function modelToTypeScriptSource(model: DMMF.Model): string {
  return endent`
    export const ${model.name} = {
      ${model.fields.map(fieldToTypeScriptSource).join(`,${OS.EOL}`)},
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
      type: '${field.type}',
      isList: ${field.isList},
      isRequired: ${field.isRequired},
      isId: ${field.isId},
      isUnique: ${field.isUnique},
      hasDefaultValue: ${field.hasDefaultValue},
      documentation: ${field.documentation ?? null},
    }
  `
}
