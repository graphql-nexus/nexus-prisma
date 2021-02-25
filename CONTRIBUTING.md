## Tests

- We disable `kleur` colors so snapshots do not have them. It would be nice to put the DX of colors into tests but needs some work. Node 12/14 results in different codes, [thus different snapshots](https://github.com/prisma/nexus-prisma/pull/3#issuecomment-782432471). See test-mode feature request here: https://github.com/lukeed/kleur/issues/47#issue-812419257.

## Link-Like Development

Sometimes it is useful to use a [link workflow](https://docs.npmjs.com/cli/v6/commands/npm-link). This means working on a local checkout of the Nexus Prisma source code, while trying it out in a project as local on your machine. This can be great for feeling out ideas.

Linking with Nexus Prisma is problematic because some modules in the Nexus Prisma source do file path lookups relative to where they are on disk. These lookups expect to be in the project that is using Nexus Prisma. Regular link workflows violate this assumptions.

The solution is to use [Yalc](https://github.com/wclr/yalc).

One-time instructions:

1. Install yalc on your machine `npm -g add yalc`.

Usually-one-time instructions:

1. In your project where you want to try out the local version of Nexus Prisma run `yalc add nexus-prisma`.

Every-time instructions:

1. In your Nexus Prisma checkout run the VSCode task `dev:link`.

Now every time you edit Nexus Prisma source, and after TS has emitted a build, `yalc push` will run, and you should have effectively a link workflow! 🚀
