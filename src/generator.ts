import { DMMF } from '@prisma/client/runtime'
import endent from 'endent'
import * as fs from 'fs-jetpack'
import * as OS from 'os'
import * as Path from 'path'
import * as tsm from 'ts-morph'
import { d } from './helpers/debugNexusPrisma'
import { SettingsData } from './settings'

const OUTPUT_SOURCE_DIR = Path.join(__dirname, 'runtime')

/**
 * Generate the Nexus Prisma runtime.
 *
 * This will transform the given DMMF into JS source code with accompanying TS declarations. This will be
 * emitted into a "hole" in the internal package source tree.
 */
export function generateRuntime(dmmf: DMMF.Document, _settings: SettingsData): void {
  d('start generateRuntime')

  const generatedSource = generateRuntimeSource(dmmf)

  d('done generateRuntime')

  d('start create TS project and emit transpiled JS')

  const tsProject = new tsm.Project({
    compilerOptions: {
      declaration: true,
      declarationMap: true,
    },
    useInMemoryFileSystem: true,
  })

  tsProject.createSourceFile(
    'index.ts',
    endent`
      export * as models from './models'
    `
  )

  tsProject.createSourceFile('models.ts', generatedSource)

  const emitResult = tsProject.emitToMemory()

  d('done create TS project and emit transpiled JS')

  d(`start writing emitted files to ${OUTPUT_SOURCE_DIR}`)

  emitResult.getFiles().forEach((emittedFile) => {
    const packageModulePath = Path.join(OUTPUT_SOURCE_DIR, emittedFile.filePath)
    fs.remove(packageModulePath)
    fs.write(packageModulePath, emittedFile.text)
    d(`done writing emitted file ${packageModulePath}`)
  })

  d(`done writing all emitting files`)
}

/** Transform the given DMMF into TS source code. */
export function generateRuntimeSource(dmmf: DMMF.Document): string {
  return dmmf.datamodel.models.map(modelToTypeScriptSource).join(OS.EOL + OS.EOL)
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
