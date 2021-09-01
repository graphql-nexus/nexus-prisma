1. Install dependencies

   ```
   npm add nexus-prisma nexus graphql @prisma/client
   npm add --dev prisma
   ```

   > `nexus` `graphql` and `@prisma/client` are peer dependencies. `prisma` is for the Prisma CLI which you'll probably want during development.

   > If you use `nexus@=<1.0` then you must use `t.field(<NAME>, <CONFIG>)` instead of `t.field(<CONFIG>)`. The Nexus Prisma docs assume the latter form.

1. Add a `nexus-prisma` generator block to your Prisma Schema.

1. Run `prisma generate` in your terminal.

1. Import models from `nexus-prisma` and then pass them to your Nexus type definition and field definition configurations. In this way you will be effectively projecting models from your data layer into GraphQL types in your API layer.

##### Example

```prisma

generator client {
  provider = "prisma-client-js"
}

generator nexusPrisma {
   provider = "nexus-prisma"
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
        t.field(User.id)
     // t.field(User.id.name, User.id)    <-- For nexus@=<1.0 users
      }
    })
  ]
})
```
