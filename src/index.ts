import { enforceValidPeerDependencies } from './lib/peerDepValidator'

enforceValidPeerDependencies({
  packageJson: require('../../package.json'),
})

const nexusPrisma = 'todo'

export { nexusPrisma }

export default nexusPrisma
