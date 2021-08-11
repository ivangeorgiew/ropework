import { getCacheIdx, manageCache } from './caching'
import { logError } from './logging'

export const createFunc = function (props) {
    try {
        const { descr, useCache, func, onError } = props

        const hasCaching = typeof useCache === 'function'
        const cacheKeys = hasCaching ? [] : undefined
        const cacheValues = hasCaching ? [] : undefined

        if (typeof useCache === 'function' && !Array.isArray(useCache([]))) {
            throw new TypeError('useCache must return an array')
        }

        let isNextCallFirst = true

        const innerCatch = function (args, error) {
            try {
                logError({ descr, error, args })

                try {
                    return onError({ descr, args, error })
                } catch (error) {
                    logError({ descr: `catching errors for ${descr}`, args, error })
                }
            } catch (error) {
                // in case any call throws
            }
        }

        return function (...args) {
            let isFirstCall, result

            try {
                let argsToCache

                if (hasCaching) {
                    argsToCache = useCache(args)

                    const cacheIdx = getCacheIdx(argsToCache, cacheKeys)

                    if (cacheIdx !== -1) {
                        if (cacheIdx !== 0) {
                            manageCache(
                                cacheIdx,
                                cacheKeys[cacheIdx],
                                cacheValues[cacheIdx],
                                cacheKeys,
                                cacheValues
                            )
                        }

                        return cacheValues[0]
                    }
                }

                isFirstCall = isNextCallFirst
                isNextCallFirst = false

                if (new.target === undefined) {
                    result = func.apply(this, args)
                } else {
                    result = new func(...args)
                }

                // handle async, generator and async generator
                if (typeof result === 'object' && result !== null) {
                    if (typeof result[Symbol.asyncIterator] === 'function') {
                        result = (async function* (iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                cacheKeys.length = cacheValues.length = 0
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    } else if (typeof result[Symbol.iterator] === 'function') {
                        result = (function* (iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                cacheKeys.length = cacheValues.length = 0
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    } else if (typeof result.then === 'function') {
                        result = (async function (prom) {
                            try {
                                return await prom
                            } catch (error) {
                                cacheKeys.length = cacheValues.length = 0
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    }
                }

                if (hasCaching) {
                    manageCache(
                        cacheKeys.length,
                        argsToCache,
                        result,
                        cacheKeys,
                        cacheValues
                    )
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
    } catch (error) {
        logError({
            descr: 'creating an error-handled function',
            error,
            args: [props]
        })

        return () => {}
    }
}
