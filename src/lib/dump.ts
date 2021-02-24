import { inspect } from 'util'

export function dump(x: any) {
  return console.error(inspect(x, { depth: null }))
}
