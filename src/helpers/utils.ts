import { inspect } from 'util'

export function allCasesHandled(x: never): never {
  // Should never happen, but in case it does :)
  // eslint-disable-next-line
  throw new Error(`All cases were not handled:\n${x}`)
}

export function arrayify<T>(x: T): T extends unknown[] ? T : T[] {
  /* eslint-disable @typescript-eslint/no-unsafe-return */
  /* eslint-disable @typescript-eslint/no-explicit-any */

  if (Array.isArray(x)) {
    return x as any
  }

  return [x] as any
}

export function dump(x: unknown): void {
  console.error(inspect(x, { depth: null }))
}
