import { validatePeerDependencies } from './lib/package'

validatePeerDependencies({
  packageJson: require('../package.json'),
})
