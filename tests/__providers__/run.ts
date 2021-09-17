import * as Execa from 'execa'
import { FSJetpack } from 'fs-jetpack/types'
import { createDynamicProvider } from 'kont'

export type Needs = {
  fs?: FSJetpack
}

export type Contributes = {
  run(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
  runNpmScript(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
  runAsync(command: string, options?: Execa.SyncOptions): Execa.ExecaChildProcess
  runOrThrow(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
  runOrThrowNpmScript(command: string, options?: Execa.SyncOptions): Execa.ExecaSyncReturnValue
}

/**
 *  If upstream adds `fs` to context then is used to get the default CWD for commands.
 */
export const run = () =>
  createDynamicProvider<Needs, Contributes>((register) =>
    register.before((ctx) => {
      const cwd = ctx.fs?.cwd() ?? process.cwd()
      return {
        run(command, options) {
          // console.log(`${command} ...`)
          return Execa.commandSync(command, {
            cwd,
            ...options,
            reject: false,
          })
        },
        runNpmScript(command, options) {
          // console.log(`${command} ...`)
          return Execa.commandSync(`npm run --silent ${command}`, {
            cwd,
            ...options,
            reject: false,
          })
        },
        runOrThrow(command, options) {
          // console.log(`${command} ...`)
          return Execa.commandSync(command, {
            cwd,
            ...options,
          })
        },
        runOrThrowNpmScript(command, options) {
          // console.log(`${command} ...`)
          return Execa.commandSync(`npm run --silent ${command}`, {
            cwd,
            ...options,
          })
        },
        runAsync(command, options) {
          // console.log(`${command} ...`)
          return Execa.command(command, {
            cwd,
            ...options,
          })
        },
      }
    })
  )
