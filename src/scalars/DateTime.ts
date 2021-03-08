import { GraphQLScalarType } from 'graphql'
import { DateTimeResolver } from 'graphql-scalars'
import { asNexusMethod } from 'nexus'

export const dateTimeScalar = asNexusMethod(new GraphQLScalarType(DateTimeResolver), 'dateTime')
