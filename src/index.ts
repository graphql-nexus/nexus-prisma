import { validatePeerDependencies } from './lib/package'

validatePeerDependencies({
  packageJson: require('../package.json'),
})

const nexusPrisma = 'todo'

export { nexusPrisma }

export default nexusPrisma
