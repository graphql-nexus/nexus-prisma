import { inspect } from 'util'

export function dump(x: unknown): void {
  console.error(inspect(x, { depth: null }))
}
