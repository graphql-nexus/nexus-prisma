---
title: Recipes - Docs
description: This plugin integrates Prisma into Nexus. It gives you an API you to project fields from models defined in your Prisma schema into your GraphQL API. It also gives you an API to build GraphQL root fields that allow your API clients to query and mutate data.
---

# Recipes

## Project relation with custom resolver logic

Nexus Prisma generates default GraphQL resolvers for your model _relation fields_. However you may want to run custom logic in the resolver. This is easy to do. The following show a few ways.

1. **Wrap Style** You can access the default resolver within your own custom resolver.

   ```ts
   objectType({
     name: User.$name,
     definition(t) {
       t.field(User.id)
       t.field({
         ...User.posts,
         async resolve(...args) {
           // Your custom before-logic here
           const result = await User.posts.resolve(...args)
           // Your custom after-logic here
           return result
         },
       })
     },
   })
   ```

2. **Replace Style** You can simply opt out of using the default resolver completely:

   ```ts
   objectType({
     name: User.$name,
     definition(t) {
       t.field(User.id)
       t.field({
         ...User.posts,
         async resolve(...args) {
           // Your custom logic here
         },
       })
     },
   })
   ```

## Supply custom scalars to your GraphQL schema

The following is a brief example how you could add your own custom GraphQL custom scalars to satisfy Nexus Prisma. Note that most of the time using the defaults exported by `nexus-prisma/scalars` will probably be good enough for you.

```ts
import { GraphQLScalarType } from 'graphql'
import { JSONObjectResolver, DateTimeResolver } from 'graphql-scalars'
import { asNexusMethod, makeSchema } from 'nexus'

const jsonScalar = new GraphQLScalarType({
  ...JSONObjectResolver,
  // Override the default 'JsonObject' name with one that matches what Nexus Prisma expects.
  name: 'Json',
})

const dateTimeScalar = new GraphQLScalarType(DateTimeResolver)

makeSchema({
  types: [asNexusMethod(jsonScalar, 'json'), asNexusMethod(dateTimeScalar, 'dateTime')],
})
```
