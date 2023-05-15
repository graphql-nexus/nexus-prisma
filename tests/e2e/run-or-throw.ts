export const bindRunOrThrow = (ctx: any) => {
  const bind = (key: string) => {
    const internal = ctx[key]
    ctx[key] = (...args: any[]) => {
      console.log('START:', args[0])
      const result = internal(...args)
      console.log('END', args[0])
      return result
    }
  }
  bind('runOrThrow')
  bind('runOrThrowPackageScript')
}
