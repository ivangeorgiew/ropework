import { isDev } from '../api/constants'
import { getCacheIdx, handledFuncs } from './helpers'
import { logError } from './logging'

export const createFunc = (descr, onError, func, shouldCache) => {
    try {
        if (handledFuncs.has(func)) {
            return func
        }

        const funcLen = func.length
        const cacheKeys = []
        const cacheValues = []

        let isNextCallFirst = true

        const manageCache = (_idx, key, value) => {
            try {
                let idx = _idx > 5 ? 5 : _idx

                while (idx--) {
                    cacheKeys[idx + 1] = cacheKeys[idx]
                    cacheValues[idx + 1] = cacheValues[idx]
                }

                cacheKeys[0] = key
                cacheValues[0] = value
            } catch (_e) {
                // nothing
            }
        }

        const innerCatch = (args, error) => {
            try {
                logError({ descr, error, args })

                try {
                    return onError({ descr, args, error })
                } catch (error) {
                    logError({
                        descr: `catching errors for [${descr}]`,
                        args,
                        error,
                    })
                }
            } catch (_e) {
                // nothing
            }

            return undefined
        }

        const getCurry = args => {
            try {
                const result = function (...newArgs) {
                    try {
                        const rest =
                            newArgs.length === 0 && funcLen - args.length === 1
                                ? [undefined]
                                : newArgs

                        // eslint-disable-next-line no-use-before-define
                        return innerFunc.apply(this, args.concat(rest))
                    } catch (error) {
                        return innerCatch(args.concat(newArgs), error)
                    }
                }

                manageCache(cacheKeys.length, args, result)

                return result
            } catch (error) {
                return innerCatch(args, error)
            }
        }

        const innerFunc = function (...args) {
            let isFirstCall
            let result

            try {
                const cacheIdx = getCacheIdx(args, cacheKeys)

                if (cacheIdx !== -1) {
                    if (cacheIdx !== 0) {
                        manageCache(
                            cacheIdx,
                            cacheKeys[cacheIdx],
                            cacheValues[cacheIdx]
                        )
                    }

                    return cacheValues[0]
                }

                isFirstCall = isNextCallFirst
                isNextCallFirst = false

                // normal call or constructor
                if (new.target === undefined) {
                    if (args.length < funcLen) {
                        return getCurry(args)
                    } else {
                        result = func.apply(this, args)
                    }
                } else {
                    result = new func(...args)
                }

                let shouldStore = true

                // handle async, generator and async generator
                if (typeof result === 'object' && result !== null) {
                    if (typeof result[Symbol.asyncIterator] === 'function') {
                        shouldStore = false
                        result = (async function* (iter) {
                            try {
                                const res = yield* iter

                                if (shouldCache) {
                                    manageCache(cacheKeys.length, args, iter)
                                }

                                return res
                            } catch (error) {
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    } else if (typeof result[Symbol.iterator] === 'function') {
                        shouldStore = false
                        result = (function* (iter) {
                            try {
                                const res = yield* iter

                                if (shouldCache) {
                                    manageCache(cacheKeys.length, args, iter)
                                }

                                return res
                            } catch (error) {
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    } else if (typeof result.then === 'function') {
                        shouldStore = false
                        result = (async function (prom) {
                            try {
                                const res = await prom

                                if (shouldCache) {
                                    manageCache(cacheKeys.length, args, prom)
                                }

                                return res
                            } catch (error) {
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    }
                }

                if (shouldCache && shouldStore) {
                    manageCache(cacheKeys.length, args, result)
                }
            } catch (error) {
                if (!isFirstCall) throw error
                result = innerCatch(args, error)
            }

            if (isFirstCall) {
                isNextCallFirst = true
            }

            return result
        }

        if (isDev) {
            Object.defineProperty(innerFunc, 'name', {
                value: `[${descr}]`,
                configurable: true,
            })
        }

        handledFuncs.add(innerFunc)

        return innerFunc
    } catch (error) {
        logError({
            descr: 'creating an error-handled function',
            error,
            args: [descr, onError, func, shouldCache],
        })

        return () => {}
    }
}
