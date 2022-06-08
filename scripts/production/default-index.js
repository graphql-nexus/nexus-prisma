const lodash = require('lodash')
/**
 * This proxy enables users to _not_ get blocked from generating Nexus Prisma. In order to generate Nexus
 * Prisma they must run Nexus reflection. This in turn means running through code that is using Nexus Prisma.
 * If we didn't use a proxy, then all that code using Nexus Prisma would not work, unless Nexus Prisma had
 * been generated before. Chicken & Egg situation.
 *
 * This solution allows them to do basically anything with Nexus Prisma _before generation_ without hitting
 * runtime errors.
 */
const runtimeProxy = new Proxy(lodash.noop, {
  get() {
    return runtimeProxy
  },
  apply() {
    return runtimeProxy
  },
})

/**
 * If you're seeing this it means that you have not generated Nexus Prisma.
 *
 * Nexus Prisma is partly a generated library. Before using it you must run its generation step.
 *
 * To run its generation step simply run Nexus reflection like you normally would.
 */
module.exports = {
  PleaseRunPrismaGenerate: runtimeProxy,
}
