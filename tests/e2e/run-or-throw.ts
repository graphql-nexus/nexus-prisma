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
  const runAsyncInternal = ctx.runAsync

  ctx.runAsync = async (...args: any[]) => {
    console.log('START:', args[0])
    const start = Date.now()
    const promise = runAsyncInternal(...args)

    const timeout = setTimeout(() => {
      promise.kill('SIGTERM', {
        forceKillAfterTimeout: 3 * 60 * 1000,
      })
    }, 2 * 60 * 1000)

    const result = await promise
      .then((data: any) => {
        clearTimeout(timeout)
        return data
      })
      .catch((error: any) => {
        console.log(error)
        return Promise.reject(error)
      })

    const end = Date.now()
    const diff = (end - start) / 1000
    console.log(`END (${diff}s)`, args[0])
    return result
  }
}
