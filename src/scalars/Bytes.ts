import { GraphQLScalarType } from 'graphql'
import { ByteResolver } from 'graphql-scalars'
import { asNexusMethod } from 'nexus'

/**
 * A Nexus scalar type definition for the `Bytes` scalar type represents byte value as specified by [NodeJS
 * Buffer type](https://nodejs.org/api/buffer.html)
 *
 * Contributes a scalar to your GraphQL schema called `Bytes`.
 *
 * Contributes a `t` `[1]` helper method called `bytes`
 *
 * `[1]` A `t` helper method refers to a method on the argument given to a `definition` method. Helper methods
 * here typically help you quickly create new fields.
 *
 * @example
 *
 *   import { makeSchema, objectType } from 'nexus'
 *   import { Bytes } from 'nexus-prisma/scalars'
 *
 *   SomeObject = objectType({
 *     name: 'SomeObject',
 *     definition(t) {
 *       t.bytes('someBytesField')
 *     },
 *   })
 *
 *   makeSchema({
 *     types: [Bytes, SomeObject],
 *   })
 *
 */
export const Bytes = asNexusMethod(
  new GraphQLScalarType({
    ...ByteResolver,
    // Override the default 'Byte' name with one that matches what Nexus Prisma expects.
    name: 'Bytes',
  }),
  'bytes',
)
