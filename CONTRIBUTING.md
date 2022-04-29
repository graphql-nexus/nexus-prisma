## Links

Sometimes links are placed into the README or in logs that we want to make as stable as possible and friendly to read. To achieve both we use short links like `pris.ly/foo`. We manage these for Nexus Prisma in the [`prisma/pris.ly` repo here](https://github.com/prisma/pris.ly/blob/main/_redirects#L175).

## Tests

#### Running

- You can run tests with `yarn test`

- You can update snapshots with the Jest CLI:
  - `yarn test -u`
  - `yarn test --update-snapshots`
  - More details here https://jestjs.io/docs/snapshot-testing#updating-snapshots

#### Remarks

- We disable `kleur` colors so snapshots do not have them. It would be nice to put the DX of colors into tests but needs some work. Node 12/14 results in different codes, [thus different snapshots](https://github.com/prisma/nexus-prisma/pull/3#issuecomment-782432471). See test-mode feature request here: https://github.com/lukeed/kleur/issues/47#issue-812419257.

- E2e tests run against a [Heroku Postgres database](https://data.heroku.com/datastores/6e28e827-3dec-4181-b7a1-b219c5016437). Each run of the test e2e test will reset all data in that database. We do not use `docker-compose` because [it is not available on the macOS docker images](https://github.com/actions/virtual-environments/issues/17#issuecomment-614726536) and it is not possible to run Postgres in Windows GitHub actions machines either. Our CI runs against all OS's.
- To run E2e tests in your local you will need to create a `.env` file and put your local postgresql DB connection URL `E2E_DB_SCHEMA=postgresql://prisma:prisma@localhost:5432/nexus-prisma`.
- To run E2e tests in your GitHub fork repo actions workflow you will need to add a GitHub actions secrets has an online postgresql url connection with the name `E2E_DB_URL`.

## Link-Like Development

Sometimes it is useful to use a [link workflow](https://docs.npmjs.com/cli/v6/commands/npm-link). This means working on a local checkout of the Nexus Prisma source code, while trying it out in a project as local on your machine. This can be great for feeling out ideas.

Linking with Nexus Prisma is problematic because some modules in the Nexus Prisma source do file path lookups relative to where they are on disk. These lookups expect to be in the project that is using Nexus Prisma. Regular link workflows violate this assumptions.

The solution is to use [Yalc](https://github.com/wclr/yalc).

#### Instructions

Definitions:

- `Nexus Prisma`: Your local checkout of the source code.
- `Project`: Some project that you are trying out your local version of Nexus Prisma on.

One-time:

1. Install yalc on your machine `npm -g add yalc`.
1. Install nodemon on your machine `npm -g add nodemon`.

Usually-one-time:

1. In `Project` run `yalc add nexus-prisma`.

Every-time:

1. In `Nexus Prisma` run the VSCode task `dev:link`.
1. In `Project` run `nodemon --watch '.yalc/**/*' --exec 'yarn -s prisma generate'`

With all this in place, the chain reaction goes like this:

1. You change `Nexus Prisma`
1. `Nexus Prisma` TS in watch mode emits into `dist-esm` and `dist-cjs`
1. `Nexus Prisma` `nodemon` reacts to this, runs `yalc push`, Yalc emits into `Project`'s `.yalc` dir
1. `Project` `nodemon` reacts to this, runs `prisma generate`
1. You try things out with newly generated Nexus Prisma in `Project`!

One issue is being worked out related to `bin` and `chmod`: https://github.com/wclr/yalc/issues/156

If you change a dependency in `Nexus Prisma` while working (especially adding a new one) you will need to remove the `node_modules` in `Project` and re-install e.g. `yarn install`.

## Debugging

- We use `debug`. Enable by setting envar `DEBUG=nexus-prisma*`
- If you set envar `NP_DEBUG=true` then Nexus Prisma will write `dmmf.json` to CWD at generation time.
