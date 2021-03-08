import { GraphQLScalarType } from 'graphql'
import { JSONObjectResolver } from 'graphql-scalars'
import { asNexusMethod } from 'nexus'

export const jsonScalar = asNexusMethod(
  new GraphQLScalarType({
    ...JSONObjectResolver,
    // Override the default 'JsonObject' name with one that matches what Nexus Prisma expects.
    name: 'Json',
  }),
  'json'
)
