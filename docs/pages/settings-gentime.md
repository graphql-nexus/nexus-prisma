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

   2. **Prisma Directory** – The directory containing your Prisma schema. Example:

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

Please refer to the thorough JSDoc for reference documentation. Typically consumed in your IDE or [Paka](https://paka.dev/npm/nexus-prisma).

## Notes

### Prisma Schema File Generator Config

Nexus Prisma supports custom configuration of the output directory within the generator block within your Prisma Schema file like so:

```
// prisma/schema.prisma

generator nexusPrisma {
  provider = "nexus-prisma"
  output   = "../generated/nexus-prisma"
}
```

The above is equivalent to the following:

```ts
// prisma/nexus-prisma.ts

import { settings } from 'nexus-prisma/generator'

settings.change({
  output: '../generated/nexus-prisma',
})
```

It is considered idiomatic to use the Nexus Prisma configuration file instead of inline generator block configuration. Inline generator block configuration lacks autocomplete and inline JSDoc. The only reason `output` is supported is to be [symmetrical with Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client#the-location-of-prisma-client) and thus ease onboarding.

If you added a custom output path because the output will be in `.js` you will need to include the `.js` files into your `tsconfig.ts` file by adding this prop.

```json
{
  "compilerOptions": {
    "allowJs": true
  }
}
```
