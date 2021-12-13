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

Please refer to the thorough JSDoc for reference documentation. Typically consumed in your IDE or [Paka](https://paka.dev/npm/nexus-prisma).
