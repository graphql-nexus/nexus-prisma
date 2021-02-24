# nexus-prisma

[![trunk](https://github.com/prisma/nexus-prisma/actions/workflows/trunk.yml/badge.svg)](https://github.com/prisma/nexus-prisma/actions/workflows/trunk.yml)

Official Prisma plugin for Nexus

## Example

```prisma

model User {
  id    String  @id
  name  String?
  email String
}
```

```ts
import { nexusPrisma } from 'nexus-prisma'
import { makeSchema } from 'nexus'

makeSchema({
  plugins: [nexusPrisma.plugin()],
})

// Before Nexus reflection `models` is a recursive proxy trapping all interactions typed as `any`
// After Nexus reflection this data will be available to you, fully typed!

nexusPrisma.models.User.id.type // "String"
nexusPrisma.models.User.name.isRequired // false
// ...
```

## Features

### Type Safe Seamless Generated Library Code

Part of the Nexus Prisma API is generated code based on your Prisma schema. The result is an API that feels tailor made for your project.

When your project is in a state where the generated Nexus Prisma part is missing (new repo clone, reinstalled deps, etc.) Nexus Prisma gives you a runtime _proxy_ that quietly lets your runtime execute without a hard error, whilst you get your code generation development loop running.

### Opt-outable friendly runtime peer dependency checks

When `nexus-prisma` is imported it will validate that your project has peer dependencies setup correctly.

If a peer dependenvy is not installed it `nexus-prisma` will log an error and then exit 1. If its version does not satify the range supported by the current version of `nexus-prisma` that you have installed, then a warning will be logged. If you want to opt-out of this validation then set an envar as follows:

```
NO_PEER_DEPENDENCY_CHECK=true|1
PEER_DEPENDENCY_CHECK=false|0
```
