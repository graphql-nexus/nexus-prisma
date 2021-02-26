import debug from 'debug'

const debugName = 'nexus-prisma'

export const d = debug(debugName)

d.log = console.log.bind(console)

export function debugNexusPrisma(...names: string[]) {
  const d2 = debug([debugName].concat(names).join(':'))
  d2.log = console.log.bind(console)
  return d2
}

export function packageRun() {}
