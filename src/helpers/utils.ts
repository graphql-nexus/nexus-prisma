export function allCasesHandled(x: never): never {
  // Should never happen, but in case it does :)
  // eslint-disable-next-line
  throw new Error(`All cases were not handled:\n${x}`)
}
