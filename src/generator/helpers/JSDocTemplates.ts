import { DMMF } from '@prisma/client/runtime'
import dedent from 'dindist'
import { upperFirst } from 'lodash'

type JSDoc = string

type FieldModelParams = {
  field: DMMF.Field
  model: DMMF.Model
}

/**
 * Enum
 */

export function jsDocForEnum(enum_: DMMF.DatamodelEnum): JSDoc {
  const enumDoc = enum_.documentation ? `* ${enum_.documentation}` : enumMissingDoc(enum_)
  return dedent`
    /**
      ${enumIntro(enum_)}
      *
      ${enumDoc}
      *
      ${enumExample(enum_)}
      */
  `
}

function enumIntro(enum_: DMMF.DatamodelEnum): string {
  return dedent`
    * Nexus \`enumType\` configuration based on the \`${enum_.name}\` enum in your Prisma schema.
  `
}

function enumExample(enum_: DMMF.DatamodelEnum): string {
  return dedent`
    * @example
    *
    * import { enumType } from 'nexus'
    * import { ${enum_.name} } from 'nexus-prisma'
    *
    * enumType(${enum_.name})
  `
}

function enumMissingDoc(enum_: DMMF.DatamodelEnum): string {
  return dedent`
    ${missingDocsIntro('enum')}
    *
    * \`\`\`prisma
    * /// Lorem ipsum dolor sit amet...
    * enum ${enum_.name} {
    ${enum_.values.map((value) => `*   ${value.name}`).join('\n')}
    * }
    * \`\`\`
    * 
    ${missingDocsOutro}
  `
}

/**
 * Model
 */

export function jsDocForModel(model: DMMF.Model): JSDoc {
  const modelDoc = model.documentation ? `* ${model.documentation}` : modelMissingDoc(model)
  return dedent`
    /**
      ${modelIntro(model)}
      *
      ${modelDoc}
      *
      ${modelExample(model)} 
      */
  `
}

function modelIntro(model: DMMF.Model): string {
  return dedent`
    * Nexus \`objectType\` related configuration based on the \`${model.name}\` model in your Prisma schema.
  `
}

function modelMissingDoc(model: DMMF.Model): string {
  // TODO once https://stackoverflow.com/questions/61893953/how-to-escape-symbol-in-jsdoc-for-vscode
  // is resolved then we can write better examples below like: id String @id
  return dedent`
    ${missingDocsIntro('model')}
    * 
    * \`\`\`prisma
    * /// Lorem ipsum dolor sit amet...
    * model ${model.name} {
    *   foo  String
    * }
    * \`\`\`
    * 
    ${missingDocsOutro}
  `
}

function modelExample(model: DMMF.Model): string {
  return dedent`
    * @example
    *
    * import { objectType } from 'nexus'
    * import { ${model.name} } from 'nexus-prisma'
    *
    * objectType({
    *   name: ${model.name}.$name
    *   description: ${model.name}.$description
    *   definition(t) {
    *     t.field(${model.name}.id.name, ${model.name}.id)
    *   }
    * })
  `
}

/**
 * Field
 */

export function jsDocForField({ field, model }: FieldModelParams): JSDoc {
  const fieldDocs = field.documentation ? `* ${field.documentation}` : fieldMissingDoc({ field, model })
  return dedent`
    /**
     ${fieldIntro({ field, model })}
      *
      ${fieldDocs}
      *
      ${fieldExample({ field, model })} 
      */
  `
}

function fieldIntro({ model, field }: FieldModelParams): string {
  return dedent`
    * Nexus \`t.field\` related configuration based on the \`${model.name}.${field.name}\` field in your Prisma schema.
  `
}

function fieldMissingDoc({ model, field }: FieldModelParams): string {
  return dedent`
    ${missingDocsIntro('model')}
    * \`\`\`prisma
    * model ${model.name} {
    *   /// Lorem ipsum dolor sit amet.
    *   ${field.name}  ${field.type}${field.isRequired ? '' : '?'}
    * }
    * \`\`\`
    *
    ${missingDocsOutro}
  `
}

function fieldExample({ model, field }: FieldModelParams): string {
  return dedent`
    * @example
    *
    * import { objectType } from 'nexus'
    * import { ${model.name} } from 'nexus-prisma'
    *
    * objectType({
    *   name: ${model.name}.$name
    *   description: ${model.name}.$description
    *   definition(t) {
    *     t.field(${model.name}.${field.name}.name, ${model.name}.${field.name})
    *   }
    * })
  `
}

/**
 * Helpers
 */

function missingDocsIntro(kind: 'model' | 'enum' | 'field'): string {
  return dedent`
     * ### ️⚠️ Missing Documentation for this ${upperFirst(kind)}
     * 
     * Automatically ✨ enrich this JSDoc with information about your enum
     * type by documenting it in your Prisma schema. For example:
     * 
  `
}

const missingDocsOutro = `* Learn more about Prisma Schema documentation comments [here](https://www.prisma.io/docs/concepts/components/prisma-schema#comments).`
