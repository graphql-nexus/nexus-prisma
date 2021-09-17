import * as Fs from 'fs-jetpack'
import { FSJetpack } from 'fs-jetpack/types'
import { createDynamicProvider, Nothing } from 'kont'

type Params = {
  path: string
}

export type Contributes = {
  fs: FSJetpack
}

export const tmpDir = (params?: Params) =>
  createDynamicProvider<Nothing, Contributes>((register) =>
    register.before(() => {
      const path = params?.path ?? Fs.tmpDir().cwd()
      const fs = Fs.cwd(path)
      return {
        fs,
      }
    })
  )
