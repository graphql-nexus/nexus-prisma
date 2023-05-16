import { konn, providers } from 'konn'
import * as Path from 'path'
import { stripEndingLines } from '../__helpers__/helpers'
import { project } from '../__providers__/project'

const ctx = konn()
  .useBeforeEach(providers.dir())
  .useBeforeEach(providers.run())
  .useBeforeEach(project())
  .done()

it('gentime setting output: custom directory', () => {
  ctx.fixture.use(Path.join(__dirname, 'fixtures/basic'))
  ctx.fs.remove('prisma/nexus-prisma.ts')
  ctx.fs.write(
    'prisma/schema.prisma',
    `
      datasource db {
        provider = "sqlite"
        url      = "file:./db.sqlite"
      }

      generator client {
        provider = "prisma-client-js"
      }

      generator nexusPrisma {
        provider = "nexus-prisma"
        // Testing this.
        output   = "../generated/nexus-prisma"
      }

      model Foo {
        id String @id @default(cuid())
      }
    `
  )
  ctx.runOrThrow(`${Path.join(process.cwd(), 'node_modules/.bin/yalc')} add ${ctx.thisPackageName}`)
  ctx.runOrThrow(`pnpm install`, { env: { PEER_DEPENDENCY_CHECK: 'false' } })
  ctx.runOrThrow(`npx prisma generate`)
  const result = ctx.runOrThrowPackageScript(`dev`, { env: { PEER_DEPENDENCY_CHECK: 'false' } })
  expect(stripEndingLines(result.stdout)).toMatchSnapshot()
})
