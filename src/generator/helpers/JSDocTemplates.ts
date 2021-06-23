import { DMMF } from '@prisma/client/runtime'
import dedent from 'dindist'

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
      * Contains these members: ${enum_.values.map((value) => value.name).join(', ')}
      *
      ${enumExample(enum_)}
      */
  `
}

function enumIntro(enum_: DMMF.DatamodelEnum): string {
  return dedent`
    * Generated Nexus \`enumType\` configuration based on your Prisma schema's enum \`${enum_.name}\`.
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
    ${missingDocsIntro({ kind: 'enum', enum: enum_ })}
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
    * Generated Nexus \`objectType\` configuration based on your Prisma schema's model \`${model.name}\`.
  `
}

function modelMissingDoc(model: DMMF.Model): string {
  // TODO once https://stackoverflow.com/questions/61893953/how-to-escape-symbol-in-jsdoc-for-vscode
  // is resolved then we can write better examples below like: id String @id
  return dedent`
    ${missingDocsIntro({ kind: 'model', model })}
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
    *     t.field(${model.name}.id)
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
    * Generated Nexus \`t.field\` configuration based on your Prisma schema's model-field \`${model.name}.${field.name}\`.
  `
}

function fieldMissingDoc({ model, field }: FieldModelParams): string {
  return dedent`
    ${missingDocsIntro({ kind: 'model', model })}
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
    *     t.field(${model.name}.${field.name})
    *   }
    * })
  `
}

/**
 * Helpers
 */

function missingDocsIntro(
  info: { kind: 'model'; model: DMMF.Model } | { kind: 'enum'; enum: DMMF.DatamodelEnum } | { kind: 'field' }
): string {
  const thisItem =
    info.kind === 'enum'
      ? `enum ${info.enum.name}`
      : info.kind === 'model'
      ? `model ${info.model.name}`
      : info.kind

  return dedent`
     * ### ️⚠️ You have not writen documentation for ${thisItem}
     * 
     * Replace this default advisory JSDoc with your own documentation about ${thisItem}
     * by documenting it in your Prisma schema. For example:
     * 
  `
}

const missingDocsOutro = `* Learn more about documentation comments in Prisma schema files [here](https://www.prisma.io/docs/concepts/components/prisma-schema#comments).`
