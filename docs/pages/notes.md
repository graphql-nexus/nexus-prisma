# Notes

### Which should I use? `nexus-plugin-prisma` vs `nexus-prisma` vs Vanilla Nexus

#### Vanilla Nexus

[npm](https://npmjs.org/nexus) | [github](https://github.com/graphql-nexus/nexus)

If stability is the most important thing for you then Prisma+Nexus vanilla is probably good for you.

- pro: flexible
- pro: stable
- con: If you have a lot of boilerplate CRUD then might feel painful

#### `nexus-plugin-prisma`

[npm](https://npmjs.org/nexus-plugin-prisma) | [github](https://github.com/graphql-nexus/nexus-plugin-prisma)

If automatic CRUD is the most important thing for you then maybe stick with the old nexus-prisma.

- pro: rich automated CRUD featureset
- con: not flexible
- con: not being actively maintained
- con: not kept up to date with Prisma
- con: buggy

#### `nexus-prisma`

[npm](http://npmjs.org/nexus-prisma) | [github](https://github.com/prisma/nexus-prisma)

If you would benefit from model projection features and are ok with using early access software then consider `nexus-prisma`.

- pro: flexible
- pro: maintained
- con: early access, things may change, bugs may be present, features may be incomplete.

### Working with Bundlers

#### Disable Peer Dependency Check

When working with bundlers, it probably makes sense to disable the rutnime peer dependency check system since the bundle step is merging the dependency tree into a single file and may be moved to run standalone away from the original project manifest (e.g. in a docker container).

Instructions to do this can be found [here](/features#peer-dependency-validation).

#### General Support

`nexus-prisma` has tests showing that it supports `ncc`. Other bundlers are not tested and may or may not work. It is our goal however that nexus-prisma not be the reason for any popular bundler to not work on your project. So if you encounter a problem with one (e.g. `parcel`), open an issue here and we'll fix the issue including an addition to our test suite.

### For users of `nexus-prisma@=<0.20`

Versions of `nexus-prisma` package prior to `0.20` were a completely different version of the API, and had also become deprecated at one point to migrate to `nexus-plugin-prisma` when Nexus Framework was being worked on. All of that is history.

### For users of `nexus@=<1.0`

The [release of Nexus 1.1](https://github.com/graphql-nexus/nexus/releases/tag/1.0.0) introduced an overload to `t.field` allowing improved usage of Nexus Prisma. The difference is as follows. Note if you prefer the older way that is and always will be supported too.

```diff ts
import { User } from 'nexus-prisma'
import { makeSchema, objectType } from 'nexus'

export const schema = makeSchema({
  types: [
    objectType({
      name: User.$name
      description: User.$description
      definition(t) {
+        t.field(User.id) //                 <-- for nexus@>=1.1 users
-        t.field(User.id.name, User.id) //   <-- For nexus@=<1.0 users
      }
    })
  ]
})
```

### Supported Versions Of Node

We only officially support what we test.

We test Node versions that are `Active LTS` and `Current`. For which versions of Node that equals you can refer to our tests or look here: https://nodejs.org/en/about/releases.

### Supported Versions Of `@prisma/client`

We only officially support what we test.

We test Prisma Client versions `2.30.x`, `2.29.x`.

### Supported Versions Of `ts-node`

We only officially support what we test.

We test `ts-node` versions `10.x`.

Reminder: `ts-node` is an optional peer dep required when you are working with the [gentime settings](https://pris.ly/nexus-prisma/docs/settings/gentime).

#### Matrix Testing Policy

We test the latest versions of `@prisma/client` against Node 16 and 14 on Ubuntu, macOS, and Windows while past versions of `@prisma/client` are tested only against Node 16 on Ubuntu. We do this to keep the CI test matris reasonable as the number of past `@prisma/client` versions supported could grow long.

#### Patch Version Support Policy

We only support the latest patch version of a minor series. For example imagine that there was a bug when `nexus-prisma` was integrated with `@prisma/client@2.30.1` but _not_ when integrated with `@prisma/client@2.30.2`. Our policy would be that users should upgrade to the latest `2.30.x` version, and that we would not release any no code changes of `nexus-prisma`.
