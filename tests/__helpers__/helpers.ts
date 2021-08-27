import * as fs from 'fs-jetpack'
import * as Path from 'path'

export function assertBuildPresent() {
  if (
    fs.exists(Path.join(__dirname, '../../dist-esm')) !== false &&
    fs.exists(Path.join(__dirname, '../../dist-cjs')) !== false
  )
    return

  throw new Error(`Please build package before running this test`)
}
