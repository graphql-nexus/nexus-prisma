import { PrismaClient } from '@prisma/client'
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

/**
 * Use duck typing to determine if the value is an instance of the Prisma Client.
 */
export const duckTypeIsPrismaClient = (
  prisma: unknown,
  prismaOrmModelPropertyName: string
): prisma is PrismaClient => {
  return (
    prisma !== null &&
    typeof prisma === 'object' &&
    // @ts-expect-error How else can we do this?
    prisma[prismaOrmModelPropertyName] !== null &&
    // @ts-expect-error How else can we do this?
    typeof prisma[prismaOrmModelPropertyName] === 'object' &&
    // @ts-expect-error How else can we do this?
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof prisma[prismaOrmModelPropertyName].findUnique === 'function' &&
    // @ts-expect-error How else can we do this?
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof prisma[prismaOrmModelPropertyName].findMany === 'function'
  )
}
