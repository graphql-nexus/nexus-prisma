# Gentime Settings

You are able to control certain aspects of the Nexus Prisma code generation.

## Usage

1. Create a configuration file named any of:

   ```
   nexusPrisma.ts  /  nexus-prisma.ts  /  nexus_prisma.ts
   ```

   In one of the following directories:

   1. **Project Root** – The directory containing your project's package.json. Example:

      ```
        ├── nexus-prisma.ts
        └── package.json
      ```

   2. **Primsa Directory** – The directory containing your Prisma schema. Example:

      ```
        ├── prisma/nexus-prisma.ts
        └── package.json
      ```

2. If you have not already, install [`ts-node`](https://github.com/TypeStrong/ts-node) which `nexus-prisma` will use to read your configuration module.

3. Import the settings singleton and make your desired changes. Example:

   ```ts
   import { settings } from 'nexus-prisma/generator'

   settings({
     projectIdIntToGraphQL: 'ID',
   })
   ```

## Reference

#### `projectIdIntToGraphQL: 'ID' | 'Int'`

- **`@default`** `Int`
- **`@summary`** Map Prisma model fields of type `Int` with attribute `@id` to `ID` or `Int`.

#### `jsdocPropagationDefault?: 'none' | 'guide'`

- **`@default`** `'guide'`
- **`@summary`**

  Nexus Prisma will project your Prisma schema field/model/enum documentation into JSDoc of the generated Nexus Prisma API.

  This setting controls what Nexus Prisma should do when you have not written documentation in your Prisma Schema for a field/model/enum.

  The following modes are as follows:

  1. `'none'`

     In this mode, no default JSDoc will be written.

  2. `'guide'`

     In this mode, guide content into your JSDoc that looks something like the following:

     ```
     * ### ️⚠️ You have not writen documentation for ${thisItem}

     * Replace this default advisory JSDoc with your own documentation about ${thisItem}
     * by documenting it in your Prisma schema. For example:
     * ...
     * ...
     * ...
     ```

#### `docPropagation.JSDoc: boolean`

- **`@default`** `true`
- **`@summary`** Should Prisma Schema docs propagate as JSDoc?

#### `docPropagation.GraphQLDocs: boolean`

- **`@default`** `true`
- **`@summary`** Should Prisma Schema docs propagate as GraphQL docs?
- **`@remarks`** When this is disabled it will force `.description` property to be `undefined`. This is for convenience, allowing you to avoid post-generation data manipulation or consumption contortions.

### Prisma String @id fields project as GraphQL ID fields

All `String` fields with `@id` attribute in your Prisma Schema get projected as GraphQL `ID` types rather than `String` types.

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
    t.field(User.id)
  }
})
```

```graphql
type User {
  id: ID
}
```
