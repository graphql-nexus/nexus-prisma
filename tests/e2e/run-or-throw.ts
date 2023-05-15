export const bindRunOrThrow = (ctx: any) => {
  const bind = (key: string) => {
    const internal = ctx[key]
    ctx[key] = (...args: any[]) => {
      console.log('START:', args[0])
      const start = Date.now()
      const result = internal(...args)
      const end = Date.now()
      const diff = (end - start) / 1000
      console.log(`END (${diff}s)`, args[0])
      return result
    }
  }
  bind('runOrThrow')
  bind('runOrThrowPackageScript')
}
