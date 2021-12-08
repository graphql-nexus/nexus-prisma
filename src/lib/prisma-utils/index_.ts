import { lowerFirst } from 'lodash'
export * from './whereUniqueInput'

/**
 * Convert a set of Prisma model field names to a TS ORM property name for the WHERE input.
 *
 * ```ts
 * prismaClient.user.findUnique({ where: { some_compound_fields:  ... } })
 * //                                      ^^^^^^^^^^^^^^^^^^^^
 * ```
 */
export const TypeScriptOrmCompoundUniquePropertyName = (fieldNames: string[]) => fieldNames.join('_')

/**
 * Convert a Prisma model name as it would appear in a PSL file to its version as it would appear in the ORM `prismaClient.<model>.<operation>(...)`.
 */
export const typeScriptOrmModelPropertyNameFromModelName = (modelName: string) => lowerFirst(modelName)
