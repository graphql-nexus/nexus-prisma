import * as fs from 'fs-jetpack'

export function assertBuildPresent() {
  if (fs.exists('../../dist')) {
    throw new Error(`Please build package before running this test`)
  }
}
