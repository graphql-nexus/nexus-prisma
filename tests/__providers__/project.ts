import { provider } from 'konn'
import { Providers } from 'konn/providers'
import { merge } from 'lodash'
import readPkgUp from 'read-pkg-up'
import { PackageJson, TsConfigJson } from 'type-fest'
import { assertBuildPresent } from '../__helpers__/helpers'
import { getDynamicPackagesVersions } from '../__helpers__/packagesVersions'
import type * as Run from './run'

type Project = {
  thisPackageName: string
  fixture: {
    useAsync(path: string): Promise<void>
  }
  packageJson: {
    mergeAsync(fields: PackageJson): Promise<void>
    createAsync(fields: PackageJson): Promise<void>
  }
  tsconfig: {
    mergeAsync(fields: TsConfigJson): Promise<void>
    createAsync(fields: TsConfigJson): Promise<void>
  }
}

export type Needs = Providers.Dir.Contributes & Run.Contributes

export type Contributes = Project

export const project = () =>
  provider<Needs, Contributes>()
    .name('project')
    .before(async (ctx) => {
      assertBuildPresent()

      const thisPackageJson = (await readPkgUp({ cwd: __dirname }))?.packageJson

      if (!thisPackageJson) {
        throw new Error(`Failed to get own package.json`)
      }

      const thisPackageName = thisPackageJson.name

      const dynamicPackagesVersions = getDynamicPackagesVersions()

      const api: Project = {
        thisPackageName,
        fixture: {
          useAsync: async (path) => {
            if (!process.env.CI) {
              console.log('e2e project path:', ctx.fs.cwd())
            }
            await ctx.fs.copyAsync(path, ctx.fs.cwd(), {
              overwrite: true,
            })
            await api.packageJson.mergeAsync({
              devDependencies: {
                '@prisma/client': dynamicPackagesVersions['@prisma/client'],
                prisma: dynamicPackagesVersions.prisma,
                graphql: dynamicPackagesVersions.graphql,
                nexus: dynamicPackagesVersions.nexus,
              },
            })
          },
        },
        packageJson: {
          createAsync: async (packageJson) => {
            const fileName = 'package.json'
            await ctx.fs.writeAsync(fileName, packageJson, { jsonIndent: 2 })
          },
          mergeAsync: async (fields) => {
            const fileName = 'package.json'
            const PackageJson = await ctx.fs.readAsync(fileName, 'json')
            const PackageJsonNew = merge(PackageJson, fields)
            await ctx.fs.writeAsync(fileName, PackageJsonNew, { jsonIndent: 2 })
          },
        },
        tsconfig: {
          createAsync: async (tsconfig) => {
            const fileName = 'tsconfig.json'
            await ctx.fs.writeAsync(fileName, tsconfig, { jsonIndent: 2 })
          },
          mergeAsync: async (fields) => {
            const fileName = 'tsconfig.json'
            const tsconfig = await ctx.fs.readAsync(fileName, 'json')
            const tsconfigNew = merge(tsconfig, fields)
            await ctx.fs.writeAsync(fileName, tsconfigNew, { jsonIndent: 2 })
          },
        },
      }

      await api.packageJson.createAsync({
        name: 'some-test-project',
        version: '1.0.0',
      })
      await api.tsconfig.createAsync({
        compilerOptions: {
          strict: true,
          target: 'ES2018',
          module: 'CommonJS',
          moduleResolution: 'node',
          rootDir: 'src',
          outDir: 'build',
          esModuleInterop: true, // for ApolloServer b/c ws dep  :(
        },
        include: ['src'],
      })

      // d(`starting project setup`)
      // Execa.commandSync(`yalc publish --no-scripts`)
      // ctx.runOrThrow(`yalc add ${thisPackageName}`)
      // ctx.runOrThrow(`yarn install --legacy-peer-deps --prefer-offline`)
      // d(`done project setup`)

      return api
    })
    .done()
