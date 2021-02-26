export function allCasesHandled(x: never): never {
  throw new Error(`All cases were not handled:\n${x}`)
}
