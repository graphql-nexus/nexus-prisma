/**
 * This proxy enables users to _not_ get blocked from generating Nexus Prisma. In order to generate Nexus
 * Prisma they must run Nexus reflection. This in turn means running through code that is using Nexus Prisma.
 * If we didn't use a proxy, then all that code using Nexus Prisma would not work, unless Nexus Prisma had
 * been generated before. Chcicken & Egg situation.
 *
 * This solution allows them to do basically anything with Nexus Prisma _before generation_ without hitting
 * runtime errors.
 */
export const runtimeProxy: any = new Proxy(function () {}, {
  get() {
    return runtimeProxy
  },
  apply() {
    return runtimeProxy
  },
})
