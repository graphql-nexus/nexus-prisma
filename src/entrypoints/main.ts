import { PackageJson } from 'type-fest'
import { inspect } from 'util'
import { enforceValidPeerDependencies } from '../lib/peerDepValidator'

// Want synchronous cached require here
// eslint-disable-next-line
const packageJson = require('../../package.json') as PackageJson

if (!packageJson || !packageJson.version || !packageJson.name) {
  console.warn(
    `Nexus Prisma failed to import own package.json. It will not be able to validate your peer dependency setup! Saw:\n\n${inspect(
      packageJson
    )}`
  )
} else {
  enforceValidPeerDependencies({
    packageJson,
  })
}

export * from '.nexus-prisma'
