# nexus-prisma

[![trunk](https://github.com/prisma/nexus-prisma/actions/workflows/trunk.yml/badge.svg)](https://github.com/prisma/nexus-prisma/actions/workflows/trunk.yml)

Official Prisma plugin for Nexus.  
**Currently in development - not to be used in Production.** Follow the progress from [here](https://github.com/graphql-nexus/nexus-plugin-prisma/issues/1039).

## Installation

```
npm add nexus-prisma graphql @prisma/client
npm add --dev prisma
```

> `graphql` and `@prisma/client` are peer dependencies. `prisma` is for the Prisma CLI which you'll probably want during development.

## Usage

1. Add a `nexus-prisma` generator block to your Prisma Schema.
1. Run `prisma generate` in your terminal.
1. Import models from `nexus-prisma` and then pass them to your Nexus type definition and field definition configurations. In this way you will be effectively projecting models from your data layer into GraphQL types in your API layer.

### Example

```prisma

generator client {
  provider = "prisma-client-js"
}

generator nexusPrisma {
  // This is a temporary name, soon will be just "nexus-prisma" (pending a change in Prisma core).
  provider = "nexus-prisma"
}


/// This is a user!
model User {
  /// This is an id!
  id  String  @id
}
```

```
$ prisma generate
```

```ts
import { User } from 'nexus-prisma'
import { makeSchema, objectType } from 'nexus'

export const schema = makeSchema({
  types: [
    objectType({
      name: User.$name
      description: User.$description
      definition(t) {
        t.field(User.id.name, User.id)
      }
    })
  ]
})
```

## Features

> **Note**: ⛑ The following use abbreviated examples that skip a complete setup of passing Nexus type definition to Nexus `makeSchema`. If you are new to Nexus, Consider reading the [official Nexus tutorial](https://nxs.li/tutorial) before jumping into Nexus Prisma.

### Type-safe seamless generated library code

Following the same philosophy as Prisma Client, Nexus Prisma uses generation to create an API that feels tailor made for your project.

```prisma
model User {
  id  String  @id
}
```

```ts
import { User } from 'nexus-prisma'
import { objectType } from 'nexus'

objectType({
  name: User.$name
  description: User.$description
  definition(t) {
    t.field(User.id.name, {
      type: User.id.type,
      description: User.id.description
    })
  }
})
```

### Scalar Mapping & Custom GraphQL Scalars for Native Prisma Scalars

Like GraphQL Prisma has the concept of scalar types. Some of the Prisma scalars can be naturally mapped to standard GraphQL scalars. The mapping is as follows:

**Prisma Standard Scalar to GraphQL Standard Scalar Mapping**

| Prisma              | GraphQL   |
| ------------------- | --------- |
| `Boolean`           | `Boolean` |
| `String`            | `String`  |
| `Int`               | `Int`     |
| `Float`             | `Float`   |
| `String` with `@id` | `ID`      |

However some of the Prisma scalars do not have a natural standard representation in GraphQL. For these cases Nexus Prisma generates code that references type names matching those scalar names in Prisma. Then, you are expected to define those custom scalar types in your GraphQL API. Nexus Prisma ships with pre-defined mappings in `nexus-prisma/scalars` you _can_ use for convenience. The mapping is as follows:

**Prisma Standard Scalar to GraphQL Custom Scalar Mapping**

| Prisma     | GraphQL    | GraphQL Scalar Implementation                                     |
| ---------- | ---------- | ----------------------------------------------------------------- |
| `Json`     | `Json`     | [JsonObject](https://github.com/Urigo/graphql-scalars#jsonobject) |
| `DateTime` | `DateTime` | [DateTime](https://github.com/Urigo/graphql-scalars#datetime)     |

While you are not required to use the implementations supplied by Nexus Prisma, you _are required to define custom scalars whose name matches the above mapping_.

Here is an example using the Nexus Prisma pre-defined custom scalars:

```ts
import * as customScalars from 'nexus-prisma/scalars'
import { makeSchema } from 'nexus'

makeSchema({
  types: [customScalars],
})
```

The following is a brief example how you could roll the implementations yourself:

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

### Prisma ID field to GraphQL ID scalar type mapping

All `@id` fields in your Prisma Schema get projected as `ID` types, not `String` types.

```prisma
model User {
  id  String  @id
}
```

```ts
import { User } from 'nexus-prisma'
import { objectType } from 'nexus'

objectType({
  name: User.$name
  description: User.$description
  definition(t) {
    t.field(User.id.name, User.id)
  }
})
```

```graphql
type User {
  id: ID
}
```

### Prisma Schema model & field documentation re-use

#### GraphQL documentation for your API clients

```prisma
/// A user.
model User {
  /// A stable identifier to find users by.
  id  String  @id
}
```

```ts
import { User } from 'nexus-prisma'
import { objectType } from 'nexus'

User.$description // JSDoc: A user.
User.id.description // JSDoc: A stable identifier to find users by.

objectType({
  name: User.$name
  description: User.$description
  definition(t) {
    t.field(User.id.name, User.id)
  }
})
```

```graphql
"""
A user.
"""
type User {
  """
  A stable identifier to find users by.
  """
  id: ID
}
```

#### Internal JSDoc for your team

```prisma
/// A user.
model User {
  /// A stable identifier to find users by.
  id  String  @id
}
```

```ts
import { User } from 'nexus-prisma'

User // JSDoc: A user.
User.id // JSDoc: A stable identifier to find users by.
```

### Refined DX

These are finer points that aren't perhaps worth a top-level point but none the less add up toward a thoughtful developer experience.

##### Default JSDoc Prompts

Fields and models that you do not document will result in a helpful default JSDoc that teaches you about this.

##### Runtime Proxy

When your project is in a state where the generated Nexus Prisma part is missing (new repo clone, reinstalled deps, etc.) Nexus Prisma gives you a default runtime export named `PleaseRunPrismaGenerate` and will error with a clear message.

##### Opt-outable friendly runtime peer dependency checks

When `nexus-prisma` is imported it will validate that your project has peer dependencies setup correctly.

If a peer dependenvy is not installed it `nexus-prisma` will log an error and then exit 1. If its version does not satify the range supported by the current version of `nexus-prisma` that you have installed, then a warning will be logged. If you want to opt-out of this validation then set an envar as follows:

```
NO_PEER_DEPENDENCY_CHECK=true|1
PEER_DEPENDENCY_CHECK=false|0
```

## Notes

- Versions of `nexus-prisma` package prior to `0.20` were a completely different version of the API, and had also become deprecated at one point to migrate to `nexus-plugi-prisma` when Nexus Framework was being worked on. All of that is history.
