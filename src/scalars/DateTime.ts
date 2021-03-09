import { GraphQLScalarType } from 'graphql'
import { DateTimeResolver } from 'graphql-scalars'
import { asNexusMethod } from 'nexus'

/**
 * A Nexus scalar type definition for date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with
 * the \`date-time\` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for
 * representation of dates and times using the Gregorian calendar.
 *
 * Contributes a scalar to your GraphQL schema called `Datetime`.
 *
 * Contributes a `t` `[1]` helper method called `dateTime`
 *
 * `[1]` A `t` helper method refers to a method on the argument given to a `definition` method. Helper methods
 * here typically help you quickly create new fields.
 *
 * @example
 *
 *   import { makeSchema, objectType } from 'nexus'
 *   import { DateTime } from 'nexus-prisma/scalars'
 *
 *   SomeObject = objectType({
 *     name: 'SomeObject',
 *     definition(t) {
 *       t.dateTime('someDateTimeField')
 *     },
 *   })
 *
 *   makeSchema({
 *     types: [DateTime, SomeObject],
 *   })
 *
 */
export const DateTime = asNexusMethod(new GraphQLScalarType(DateTimeResolver), 'dateTime')
