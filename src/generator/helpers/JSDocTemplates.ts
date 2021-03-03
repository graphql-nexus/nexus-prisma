import { DMMF } from '@prisma/client/runtime'
import endent from 'endent'
import { repeat } from 'lodash'

export function jsDocForModel(model: DMMF.Model): string {
  return model.documentation
    ? endent`
        /**
         * ${model.documentation}
         */
      `
    : missingModelDocumentation(model)
}

export function jsDocForField({ field, model }: { field: DMMF.Field; model: DMMF.Model }): string {
  return field.documentation
    ? endent`
        /**
         * ${field.documentation}
         */
      `
    : missingFieldDocumentation({ field, model })
}

export function missingModelDocumentation({ name }: DMMF.Model): string {
  return endent`
    /**
     * ### 📔 Missing Model Documentation for \`${name}\`
     * 
     * Get JSDoc documentation for this model automatically by documenting
     * it in your Prisma Schema ✨!
     * 
     * To document a model add a tripple slash comment above it.
     * 
     * Learn more about Prisma Schema comments [here](https://www.prisma.io/docs/concepts/components/prisma-schema#comments).
     * 
     * ${jsDocDiviion('Example 1')}
     * 
     * \`\`\`prisma
     * /// Lorem ipsum dolor sit amet...
     * model ${name} {
     *   id  String  @id
     * }
     * \`\`\`
     * 
     * ${jsDocDiviion('Example 2')}
     * 
     * \`\`\`prisma
     * /// A user record. A user maps 1:1 with a person. Not
     * /// to be confused with an \`Account\` which on person
     * /// may have multiple of, all linked to a single \`User\`.
     * model User {
     *   id  String  @id
     * }
     * \`\`\`
     */
  `
}

export function missingFieldDocumentation({
  field,
  model,
}: {
  field: DMMF.Field
  model: DMMF.Model
}): string {
  return endent`
    /**
     * ### 📔 Missing Field Documentation for \`${field.name}\`
     * 
     * Get JSDoc documentation for this field automatically by documenting
     * it in your Prisma Schema ✨!
     * 
     * To document a field add a tripple slash comment above it.
     * 
     * Learn more about Prisma Schema comments [here](https://www.prisma.io/docs/concepts/components/prisma-schema#comments).
     * 
     * ${jsDocDiviion('Example 1')}
     * 
     * \`\`\`prisma
     * model ${model.name} {
     *   /// Lorem ipsum dolor sit amet.
     *   ${field.name}  ${field.type}${field.isRequired ? '' : '?'}
     * }
     * \`\`\`
     * 
     * ${jsDocDiviion('Example 2')}
     * 
     * \`\`\`prisma
     * model User {
     *   /// Identifier for a user. Will never change once set.
     *   /// More stable than the \`handle\` field  which user
     *   /// _can_ change, but is not human-friendly. Prefer this
     *   /// for machine consumers but prefer \`handle\` for human
     *   /// visible things like URL slugs.
     *   id  String  @id
     * }
     * \`\`\`
     */
  `
}

/**
 * Render a centered title with bars on either side filling left over space.
 *
 * Sized according to standard JSDoc window size in VSCode.
 */
function jsDocDiviion(title: string): string {
  const titlePadding = ' '
  const barLength = Math.floor(MAX_JS_DOC_LENGTH / 2 - title.length - titlePadding.length * 2)
  const bar = repeat('–', barLength)
  return endent`
    #### ${bar}${titlePadding}${title}${titlePadding}${bar}
  `
}

const MAX_JS_DOC_LENGTH = 72
