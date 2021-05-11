**⚠️ Currently in development - _not to be used in Production_.** Follow progress from [here](https://github.com/graphql-nexus/nexus-plugin-prisma/issues/1039).

# nexus-prisma

[![trunk](https://github.com/prisma/nexus-prisma/actions/workflows/trunk.yml/badge.svg)](https://github.com/prisma/nexus-prisma/actions/workflows/trunk.yml)

Official Prisma plugin for Nexus.

<!-- toc -->

- [Usage](#usage)
- [Roadmap](#roadmap)
- [Features](#features)
  - [Type-safe Generated Library Code](#type-safe-generated-library-code)
  - [Project Enums](#project-enums)
  - [Project Scalars](#project-scalars)
  - [Project Relations](#project-relations)
    - [Limitation: Hardcoded key for Prisma Client on GraphQL Context](#limitation-hardcoded-key-for-prisma-client-on-graphql-context)
    - [Example: Exposing Prisma Client on GraphQL Context with Apollo Server](#example-exposing-prisma-client-on-graphql-context-with-apollo-server)
  - [Project 1:1 Relation](#project-11-relation)
    - [Example: Full 1:1](#example-full-11)
    - [Limitation: Nullable on Without-Relation-Scalar Side](#limitation-nullable-on-without-relation-scalar-side)
  - [Prisma ID field to GraphQL ID scalar type mapping](#prisma-id-field-to-graphql-id-scalar-type-mapping)
  - [Prisma Schema docs re-used for GraphQL schema doc](#prisma-schema-docs-re-used-for-graphql-schema-doc)
  - [Prisma Schema docs re-used for JSDoc](#prisma-schema-docs-re-used-for-jsdoc)
  - [Refined DX](#refined-dx)
- [Recipes](#recipes)
  - [Supply custom custom scalars to your GraphQL schema](#supply-custom-custom-scalars-to-your-graphql-schema)
- [Notes](#notes)

<!-- tocstop -->

## Usage

1. Install dependencies

   ```
   npm add nexus-prisma graphql @prisma/client
   npm add --dev prisma
   ```

   > `graphql` and `@prisma/client` are peer dependencies. `prisma` is for the Prisma CLI which you'll probably want during development.

1. Add a `nexus-prisma` generator block to your Prisma Schema.

   > If you are using `prisma@=<2.17.x` then you must use the Nexus Prisma Prisma generator name of `nexus_prisma` instead of `nexus-prisma`. See [notes](#notes) for more detail.

1. Run `prisma generate` in your terminal.

1. Import models from `nexus-prisma` and then pass them to your Nexus type definition and field definition configurations. In this way you will be effectively projecting models from your data layer into GraphQL types in your API layer.

##### Example

```prisma

generator client {
  provider = "prisma-client-js"
}

generator nexusPrisma {
   provider = "nexus-prisma"
// provider = "nexus_prisma" <-- For prisma@=<2.17.x users
}

/// This is a user!
model User {
  /// This is an id!
  id  String  @id
}
```

```
prisma generate
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

## Roadmap

##### Done

- [x] ([#4](https://github.com/prisma/nexus-prisma/issues/4)) Support for Prisma Model field types that map to standard GraphQL scalars
- [x] ([#8](https://github.com/prisma/nexus-prisma/issues/8)) Support for Prisma Model field types of `DateTime` & `Json`
- [x] ([#16](https://github.com/prisma/nexus-prisma/issues/16)) Support for Prisma enums

##### Shortterm

- [ ] Support for Prisma Model field types of remaining scalars (`Bytes`, etc.)

##### Midterm

- [x] ([#25](https://github.com/prisma/nexus-prisma/pull/25), []())Support for Prisma Model field types relating to other Models 1:1
- [ ] Support for Prisma Model field types relating to other Models 1:n
- [ ] Support for Prisma Model field types relating to other Models n:n

##### Longterm

- [ ] Nexus Plugin? `t.model`? `t.crud`?
- [ ] ...

## Features

> **Note**: ⛑ The following use abbreviated examples that skip a complete setup of passing Nexus type definition to Nexus' `makeSchema`. If you are new to Nexus, Consider reading the [official Nexus tutorial](https://nxs.li/tutorial) before jumping into Nexus Prisma.

### Type-safe Generated Library Code

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

### Project Enums

Every enum defined in your Prisma schema becomes importable as a Nexus enum type definition configuration. This makes it trivial to project enums from your database layer into your API layer.

```prisma
enum SomeEnum {
  foo
  bar
}
```

```ts
import { SomeEnum } from 'nexus-prisma'
import { enumType } from 'nexus'

SomeEnum.name //    'SomeEnum'
SomeEnum.members // ['foo', 'bar']

enumType(SomeEnum)
```

### Project Scalars

Like GraphQL, [Prisma has the concept of scalar types](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference/#model-field-scalar-types). Some of the Prisma scalars can be naturally mapped to standard GraphQL scalars. The mapping is as follows:

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

| Prisma     | GraphQL    | Nexus `t` Helper | GraphQL Scalar Implementation                                     |
| ---------- | ---------- | ---------------- | ----------------------------------------------------------------- |
| `Json`     | `Json`     | `json`           | [JsonObject](https://github.com/Urigo/graphql-scalars#jsonobject) |
| `DateTime` | `DateTime` | `datetime`       | [DateTime](https://github.com/Urigo/graphql-scalars#datetime)     |

> **Note:** Not all Prisma scalar mappings are implemented yet: `Bytes`, `BigInt`, `Decimal`, `Unsupported`

While you are not required to use the implementations supplied by Nexus Prisma, you _are required to define custom scalars whose name matches the above mapping_.

Here is an example using the Nexus Prisma pre-defined custom scalars:

```ts
import NexusPrismaScalars from 'nexus-prisma/scalars'
import { makeSchema } from 'nexus'

makeSchema({
  types: [NexusPrismaScalars],
})
```

There is a [recipe below](#Supply-custom-custom-scalars-to-your-GraphQL-schema) showing how to add your own custom scalars if you want.

### Project Relations

You can project [relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations) into your API with Nexus Prisma. Nexus Prisma even includes the resolver you'll need at runtime to fulfill the projection by automating use of your Prisma Client instance.

Please note that not all kinds of relationships are supported yet. Details about projecting each kind of relation are documented in their respective sections. This section only contains general documentation common to all.

#### Limitation: Hardcoded key for Prisma Client on GraphQL Context

To project relations you must expose an instance of Prisma Client on the GraphQL context under the key name `prisma`. This limitation may be a problem for your project. There is an [issue tracking this](https://github.com/prisma/nexus-prisma/issues/35) that you can subscribe to if interested. The only workaround is to write your own resolvers.

#### Example: Exposing Prisma Client on GraphQL Context with Apollo Server

```ts
import { ApolloServer } from 'apollo-server'
import { PrismaClient } from '@prisma/client'
import schema from './your/schema/somewhere'

const prisma = new PrismaClient()

new ApolloServer({
  schema,
  context() {
    return {
      prisma,
    }
  },
})
```

### Project 1:1 Relation

You can project [1:1 relationships](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#one-to-one-relations) into your API.

#### Example: Full 1:1

```prisma
// Database Schema

model User {
  id         String  @id
  profile    Profile @relation(fields: [profileId], references: [id])
  profileId  String
}

model Profile {
  id      String  @id
  user    User?
}
```

```ts
// API Schema

import { User, Profile } from 'nexus-prisma'

objectType({
  name: User.$name,
  definition(t) {
    t.field(User.id.name, User.id)
    t.field(User.profile.name, User.profile)
  },
})

objectType({
  name: Profile.$name,
  definition(t) {
    t.field(Profile.id.name, Profile.id)
  },
})

queryType({
  definition(t) {
    t.list.field('users', {
      type: 'User',
      resolve(_, __, ctx) {
        return ctx.prisma.user.findMany()
      },
    })
  },
})
```

```graphql
# API Schema Represented in GraphQL SDL (this is generated by Nexus)

type User {
  id: ID
  profile: Profile
}

type Profile {
  id: ID
}
```

```ts
// Example Database Data (for following example)

await prisma.user.create({
  data: {
    id: 'user1',
    profile: {
      create: {
        id: 'profile1',
      },
    },
  },
})
```

```graphql
# Example API Client Query

query {
  users {
    id
    profile {
      id
    }
  }
}
```

```json
{
  "data": {
    "users": [
      {
        "id": "user1",
        "profile": {
          "id": "profile1"
        }
      }
    ]
  }
}
```

#### Limitation: Nullable on Without-Relation-Scalar Side

Prisma requires that a 1:1 relationship has one side that is optional. For example in the following it is **not** possible for `Profile` to have a required relationship to `User`. For more detail you can read the Prisma docs abuot this [here](https://www.prisma.io/docs/concepts/components/prisma-schema/relations#one-to-one-relations).

```prisma
model User {
  id         String  @id
  profile    Profile @relation(fields: [profileId], references: [id])
  profileId  String
}

model Profile {
  id      String  @id
  user    User?  // <--  "?" required
}
```

Prisma inherits this limitation from databases. In turn Nexus Prisma inherits this limitation from Prisma. For example consider this projection and then look at the resulting GraphQL SDL representation.

```ts
import { User, Profile } from 'nexus-prisma'

objectType({
  name: User.$name,
  definition(t) {
    t.field(User.id.name, User.id)
    t.field(User.profile.name, User.profile)
  },
})

objectType({
  name: Profile.$name,
  definition(t) {
    t.field(Profile.id.name, Profile.id)
    t.field(User.profile.name, User.profile)
  },
})
```

```graphql
type User {
  id: ID
  profile: Profile!
}

type Profile {
  id: ID
  user: User # <-- Nullable!
}
```

This limitation may be a problem for your API. There is an [issue track this that you can subscribe to](https://github.com/prisma/nexus-prisma/issues/34) if interested. As a workaround for now you can do this:

```ts
objectType({
  name: Profile.$name,
  definition(t) {
    t.field(Profile.id.name, Profile.id)
    t.field(User.profile.name, {
      ...User.profile,
      type: nonNull(User.profile.type),
    })
  },
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

### Prisma Schema docs re-used for GraphQL schema doc

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

### Prisma Schema docs re-used for JSDoc

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

##### Default JSDoc

Fields and models that you do not document will result in a helpful default JSDoc that teaches you about this.

##### Default Runtime

When your project is in a state where the generated Nexus Prisma part is missing (new repo clone, reinstalled deps, etc.) Nexus Prisma gives you a default runtime export named `PleaseRunPrismaGenerate` and will error with a clear message.

##### Peer-Dependency Validation

When `nexus-prisma` is imported it will validate that your project has peer dependencies setup correctly.

If a peer dependency is not installed it `nexus-prisma` will log an error and then exit 1. If its version does not satify the range supported by the current version of `nexus-prisma` that you have installed, then a warning will be logged. If you want to opt-out of this validation then set an envar as follows:

```
NO_PEER_DEPENDENCY_CHECK=true|1
PEER_DEPENDENCY_CHECK=false|0
```

##### Auto-Import Optimized

- `nexus-prisma/scalars` offers a default export you can easily auto-import by name: `NexusPrismaScalars`.

## Recipes

### Supply custom custom scalars to your GraphQL schema

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

## Notes

- Versions of `nexus-prisma` package prior to `0.20` were a completely different version of the API, and had also become deprecated at one point to migrate to `nexus-plugin-prisma` when Nexus Framework was being worked on. All of that is history.

- If you are using `prisma@=<2.17.x` then you must use the Nexus Prisma Prisma generator name of `nexus_prisma` instead of `nexus-prisma`. This is because prior to `prisma@2.18.x` there was a hardcode check for `nexus-prisma` that would fail with an error message about a now-old migration.
