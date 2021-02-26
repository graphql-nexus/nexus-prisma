import { enforceValidPeerDependencies } from './lib/peerDepValidator'

enforceValidPeerDependencies({
  packageJson: require('../package.json'),
})

export * from './runtime'
