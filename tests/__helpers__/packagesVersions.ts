const DYNAMIC_PACKAGES = ['graphql', 'prisma', '@prisma/client', 'nexus'] as const

const getPackageVersion = (packageName: string) => require(`${packageName}/package.json`).version

type DynamicPackagesVersions = { [K in typeof DYNAMIC_PACKAGES[number]]: string }

export const getDynamicPackagesVersions = (): DynamicPackagesVersions => {
  return DYNAMIC_PACKAGES.reduce((versions, packageName) => {
    versions[packageName] = getPackageVersion(packageName)
    return versions
  }, { } as DynamicPackagesVersions)
}
