import endent from 'endent'

export function quote(x: string): string {
  return `'${x}'`
}

export function apply(functionName: string, parameters: string | string[]): string {
  return endent`
    ${functionName}(${arrayify(parameters).join(', ')})
  `
}

function arrayify<T>(x: T): T extends unknown[] ? T : T[] {
  /* eslint-disable @typescript-eslint/no-unsafe-return */
  /* eslint-disable @typescript-eslint/no-explicit-any */

  if (Array.isArray(x)) {
    return x as any
  }

  return [x] as any
}
