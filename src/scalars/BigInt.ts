import { BigIntResolver } from 'graphql-scalars'
import { asNexusMethod } from 'nexus'

/**
 * A Nexus scalar type definition for the `BigInt` scalar type
 *
 * Contributes a scalar to your GraphQL schema called `BigInt`.
 *
 * Contributes a `t` `[1]` helper method called `bigInt`
 *
 * `[1]` A `t` helper method refers to a method on the argument given to a `definition` method. Helper methods
 * here typically help you quickly create new fields.
 *
 * @example
 *
 *   import { makeSchema, objectType } from 'nexus'
 *   import { BigInt } from 'nexus-prisma/scalars'
 *
 *   SomeObject = objectType({
 *     name: 'SomeObject',
 *     definition(t) {
 *       t.bigInt('someBigIntField')
 *     },
 *   })
 *
 *   makeSchema({
 *     types: [BigInt, SomeObject],
 *   })
 *
 */
export const BigInt = asNexusMethod(BigIntResolver, 'bigInt')
