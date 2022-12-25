import { asNexusMethod } from 'nexus'
import * as DecimalJs from 'decimal.js'
import { GraphQLScalarType, GraphQLScalarTypeConfig, Kind } from 'graphql'

/**
 * Copied from prisma-graphql-type-decimal.
 *
 * @see https://github.com/unlight/prisma-graphql-type-decimal/blob/master/src/index.ts
 */
const decimalConfig: GraphQLScalarTypeConfig<null | string | number | DecimalJs, string> = {
  name: 'Decimal',
  description: 'An arbitrary-precision Decimal type',
  /**
   * Value sent to the client
   */
  serialize(value) {
    // console.log('serialize value', value.constructor.name)
    return String(value)
  },
  /**
   * Value from the client
   */
  parseValue(value) {
    return new DecimalJs.Decimal(value as DecimalJs.Decimal.Value)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT || ast.kind === Kind.FLOAT || ast.kind === Kind.STRING) {
      return new DecimalJs.Decimal(ast.value)
    }
    return null
  },
}

/**
 * A Nexus scalar type definition for arbitrary-precision Decimal type.
 *
 * Contributes a scalar to your GraphQL schema called `Decimal`.
 *
 * Contributes a `t` `[1]` helper method called `decimal`
 *
 * `[1]` A `t` helper method refers to a method on the argument given to a `definition` method. Helper methods
 * here typically help you quickly create new fields.
 *
 * @example
 *
 *   import { makeSchema, objectType } from 'nexus'
 *   import { Decimal } from 'nexus-prisma/scalars'
 *
 *   SomeObject = objectType({
 *     name: 'SomeObject',
 *     definition(t) {
 *       t.decimal('someDecimalField')
 *     },
 *   })
 *
 *   makeSchema({
 *     types: [Decimal, SomeObject],
 *   })
 *
 */
export const Decimal = asNexusMethod(  
  new GraphQLScalarType(decimalConfig),
  'decimal'
)
