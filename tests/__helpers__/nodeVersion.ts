import * as Semver from 'semver'

export const getNodeMajorVersion = () => {
  const parsedNodeVersion = Semver.parse(process.version)
  if (!parsedNodeVersion) {
    throw new Error(`Failed to parse node version: ${process.version}`)
  }
  return parsedNodeVersion.major
}
