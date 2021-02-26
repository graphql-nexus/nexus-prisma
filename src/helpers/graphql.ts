export type GraphQLScalarType = 'ID' | 'String' | 'Int' | 'Float' | 'Boolean'

export const graphQLScalarTypes = {
  ID: 'ID',
  String: 'String',
  Float: 'Float',
  Boolean: 'Boolean',
  Int: 'Int',
} as const
