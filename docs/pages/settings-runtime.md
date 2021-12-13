# Runtime Settings

## Reference

#### `prismaClientContextField: string`

- **@summary** The name of the GraphQL context field to get an instance of Prisma Client from.
- **@remarks** The instance of Prisma Client found here is accessed in the default resolvers for relational fields.
- **@default** `"prisma"`
- **@example**

  ```ts
  // src/main.ts

  import { PrismaClient } from '@prisma/client'
  import { ApolloServer } from 'apollo-server'
  import { makeSchema } from 'nexus'
  import { User, Post, $settings } from 'nexus-prisma'

  new ApolloServer({
    schema: makeSchema({
      types: [],
    }),
    context() {
      return {
        db: new PrismaClient(), // <-- You put Prisma client on the "db" context property
      }
    },
  })

  $settings({
    prismaClientContextField: 'db', // <-- Tell Nexus Prisma
  })
  ```

#### `prismaClientImportId: string`

- **@summary** Where Nexus Prisma will try to import your generated Prisma Client from. You should not need to configure this normally because Nexus Prisma generator automatically reads the Prisma Client generator `output` setting if you have set it. The value here will be used in a dynamic import thus following Node's path resolution rules. You can pass a node_modules package like `foo` `@prisma/client`, `@my/custom/thing` etc. or you can pass an absolute module/file path `/my/custom/thing` / `/my/custom/thing/index.js` or finally a relative path to be resolved relative to the location of Nexus Prisma source files (you probably don't want this).

- **@default** `@prisma/client`

- **@remarks** Nexus Prisma imports Prisma client internally for two reasons: 1) validation wherein a class reference to Prisma Client is needed for some `instanceof` checks and 2) for acquiring the DMMF as Nexus Prisma relies on some post-processing done by Prisma Client generator.

- **@example**

  ```ts
  // src/main.ts

  import { PrismaClient } from '@prisma/client'
  import { ApolloServer } from 'apollo-server'
  import { makeSchema } from 'nexus'
  import { User, Post, $settings } from 'nexus-prisma'

  new ApolloServer({
    schema: makeSchema({
      types: [],
    }),
  })

  $settings({
    prismaClientImportId: '@my/custom/thing',
  })
  ```
