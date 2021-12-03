import { GraphQLClient } from 'graphql-request'
import { provider, Nothing } from 'konn'

export type Needs = Nothing

export type Contributes = {
  graphQLClient: GraphQLClient
}

export const graphQLClient = () =>
  provider<Needs, Contributes>()
    .name('graphQLClient')
    .before(() => {
      const graphQLClient = new GraphQLClient(`http://localhost:4000/graphql`)
      return {
        graphQLClient,
      }
    })
    .done()
