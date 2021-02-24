import { enforceValidPeerDependencies } from './lib/peerDepValidator'
import * as nexusPrisma from './nexusPrisma'

enforceValidPeerDependencies({
  packageJson: require('../package.json'),
})

export { nexusPrisma }

export default nexusPrisma
