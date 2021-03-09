import { DateTime } from './DateTime'
import { Json } from './Json'

/**
 * Predefined Nexus scalar type definitions to satisfy all custom scalars needed in GraphQL to map to the
 * native scalars in Prisma. The mapping is as follows:
 *
 * | Prisma | GraphQL | Nexus `t` Helper | GraphQL Scalar Implementation |
 * | ---------- | ---------- | ---- | ----------------------------------------------------------------- |
 * | `Json` | `Json` | `json` | [JsonObject](https://github.com/Urigo/graphql-scalars#jsonobject) |
 * | `DateTime` | `DateTime` | `datetime` | [DateTime](https://github.com/Urigo/graphql-scalars#datetime) |.
 *
 * @example
 *
 *   // Use this defualt export
 *
 *   import { makeSchema, objectType } from 'nexus'
 *   import NexusPrismaScalars from 'nexus-prisma/scalars'
 *
 *   makeSchema({
 *     types: [NexusPrismaScalars],
 *   })
 *
 * @example
 *
 *   // Use ESM namespace import if you prefer
 *
 *   import { makeSchema, objectType } from 'nexus'
 *   import * as NexusPrismaScalars from 'nexus-prisma/scalars'
 *
 *   makeSchema({
 *     types: [NexusPrismaScalars],
 *   })
 *
 * @example
 *
 *   // Use only select precefined custom scalars
 *
 *   import { makeSchema, objectType } from 'nexus'
 *   import { Json } from 'nexus-prisma/scalars'
 *
 *   makeSchema({
 *     types: [Json],
 *   })
 *
 * @example
 *
 *   // Use your own custom scalars instead of these.
 *
 *   import { GraphQLScalarType } from 'graphql'
 *   import { JSONObjectResolver, DateTimeResolver } from 'graphql-scalars'
 *   import { asNexusMethod, makeSchema } from 'nexus'
 *
 *   const jsonScalar = new GraphQLScalarType({
 *     ...JSONObjectResolver,
 *     // Override the default 'JsonObject' name with one that matches what Nexus Prisma expects.
 *     name: 'Json',
 *   })
 *
 *   const dateTimeScalar = new GraphQLScalarType(DateTimeResolver)
 *
 *   makeSchema({
 *     types: [asNexusMethod(jsonScalar, 'json'), asNexusMethod(dateTimeScalar, 'dateTime')],
 *   })
 *
 * @remarks Some  Of the Prisma scalars do not have a natural standard representation in GraphQL. For these
 *                cases Nexus Prisma generates code that references type names matching those scalar names
 *                in Prisma. Then, you are expected to define those custom scalar types in your GraphQL
 *                API. For convenience you can use these ones.
 */
const NexusPrismaScalars = {
  DateTime,
  Json,
}

export default NexusPrismaScalars

export { DateTime, Json }
