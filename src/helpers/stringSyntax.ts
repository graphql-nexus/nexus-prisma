import endent from 'endent'

export function quote(x: string): string {
  return `'${x}'`
}

export function apply(functionName: string, parameters: string | string[]): string {
  return endent`
    ${functionName}(${arrayify(parameters).join(', ')})
  `
}

function arrayify<T>(x: T): T extends any[] ? T : T[] {
  if (Array.isArray(x)) {
    return x as any
  }
  return [x] as any
}
