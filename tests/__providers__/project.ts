import * as Execa from 'execa'
import { createDynamicProvider } from 'kont'
import { Providers } from 'kont/providers'
import { merge } from 'lodash'
import readPkgUp from 'read-pkg-up'
import { PackageJson, TsConfigJson } from 'type-fest'
import { d } from '../../src/helpers/debugNexusPrisma'

type Project = {
  fixture: {
    use(path: string): void
  }
  packageJson: {
    merge(fields: PackageJson): void
    create(fields: PackageJson): void
  }
  tsconfig: {
    merge(fields: TsConfigJson): void
    create(fields: TsConfigJson): void
  }
}

export type Needs = Providers.Dir.Contributes & Providers.Run.Contributes

export type Contributes = Project

export const project = () =>
  createDynamicProvider<Needs, Contributes>((register) =>
    register.before((ctx) => {
      const thisPackageJson = readPkgUp.sync({ cwd: __dirname })?.packageJson

      if (!thisPackageJson) {
        throw new Error(`Failed to get own package.json`)
      }

      const thisPackageName = thisPackageJson.name

      const api: Project = {
        fixture: {
          use: (path) => {
            ctx.fs.copy(path, ctx.fs.cwd(), {
              overwrite: true,
            })
          },
        },
        packageJson: {
          create: (packageJson) => {
            const fileName = 'package.json'
            ctx.fs.write(fileName, packageJson, { jsonIndent: 2 })
          },
          merge: (fields) => {
            const fileName = 'package.json'
            const PackageJson = ctx.fs.read(fileName, 'json')
            const PackageJsonNew = merge(PackageJson, fields)
            ctx.fs.write(fileName, PackageJsonNew, { jsonIndent: 2 })
          },
        },
        tsconfig: {
          create: (tsconfig) => {
            const fileName = 'tsconfig.json'
            ctx.fs.write(fileName, tsconfig, { jsonIndent: 2 })
          },
          merge: (fields) => {
            const fileName = 'tsconfig.json'
            const tsconfig = ctx.fs.read(fileName, 'json')
            const tsconfigNew = merge(tsconfig, fields)
            ctx.fs.write(fileName, tsconfigNew, { jsonIndent: 2 })
          },
        },
      }

      api.packageJson.create({
        name: 'some-test-project',
        version: '1.0.0',
      })

      api.tsconfig.create({
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

      d(`starting project setup`)
      Execa.commandSync(`yalc publish --no-scripts`) // , , { stdio: 'inherit' } <-- enable in a debug mode?
      ctx.runOrThrow(`yalc add ${thisPackageName}`) // , { stdio: 'inherit' } <-- enable in a debug mode?
      ctx.runOrThrow(`npm install --legacy-peer-deps`) // , { stdio: 'inherit' } <-- enable in a debug mode?
      d(`done project setup`)

      return api
    })
  )
