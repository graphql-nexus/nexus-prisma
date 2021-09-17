import { GraphQLClient } from 'graphql-request'
import { createDynamicProvider, Nothing } from 'kont'

export type Needs = Nothing

export type Contributes = {
  graphQLClient: GraphQLClient
}

export const graphQLClient = () =>
  createDynamicProvider<Needs, Contributes>((register) =>
    register.before(() => {
      const graphQLClient = new GraphQLClient(`http://localhost:4000/graphql`)
      return {
        graphQLClient,
      }
    })
  )
