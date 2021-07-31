import { getCacheIdx, reorderCacheItem, storeCacheItem } from './caching'
import { logError } from './logging'
import { parseArgTypes, validateArgs } from './validation'

// TODO: add validation, it is currently slow during caching
// TODO: unfinishedCalls is not working for async/gen functions? (try async recursion)
const createFuncDescr = 'creating an error-handled function'
const handledFuncs = new WeakSet()

export const createFunc = function (props) {
    try {
        const areArgsValid = validateArgs(
            parseArgTypes(
                createFuncDescr,
                `{
                    :descr: str,
                    :argTypes: str | undef,
                    :useCache: () | undef,
                    :onError: () | undef,
                    :func: ()
                }`
            ),
            [props]
        )

        if (!areArgsValid) {
            throw new Error('Wrong arguments for createFunc')
        }

        const { descr, func, argTypes } = props
        const { onError, useCache } = props

        if (handledFuncs.has(func)) {
            return func
        }

        const hasValidation = false // typeof argTypes === 'string'
        const hasCaching = typeof useCache === 'function'
        const hasOnError = typeof onError === 'function'

        const parsedArgTypes = hasValidation
            ? parseArgTypes(descr, argTypes)
            : []

        if (hasCaching && !Array.isArray(useCache([]))) {
            throw new Error('useCache must return an array')
        }

        const cacheKeys = []
        const cacheValues = []

        let unfinishedCalls = 0

        const innerCatch = function (that, args, error) {
            unfinishedCalls = unfinishedCalls + 1

            if (unfinishedCalls > 1) {
                cacheKeys.length = cacheValues.length = 0
                throw error
            }

            args = Array.from(args)

            logError({ descr, error, args })

            if (hasCaching) {
                const cacheIdx = getCacheIdx(that, useCache(args), cacheKeys)

                if (cacheIdx !== -1) {
                    cacheKeys.splice(cacheIdx, 1)
                    cacheValues.splice(cacheIdx, 1)
                }
            }

            if (hasOnError) {
                try {
                    return onError.call(that, { descr, args, error })
                } catch (error) {
                    logError({
                        descr: `catching errors for ${descr}`,
                        args,
                        error
                    })
                }
            }

            unfinishedCalls = unfinishedCalls - 1
        }

        const innerFunc = function () {
            try {
                let argsToCache, cacheIdx

                if (hasCaching) {
                    argsToCache = useCache(arguments)
                    cacheIdx = getCacheIdx(this, argsToCache, cacheKeys)

                    if (cacheIdx !== -1) {
                        if (cacheIdx !== 0) {
                            reorderCacheItem(cacheIdx, cacheKeys, cacheValues)
                        }

                        return cacheValues[0]
                    }
                }

                if (hasValidation) {
                    if (!validateArgs(parsedArgTypes, arguments)) {
                        throw new Error(`Wrong arguments for ${descr}`)
                    }
                }

                let result

                if (new.target === undefined) {
                    result = func.apply(this, arguments)
                } else {
                    result = Object.setPrototypeOf(
                        new func(...arguments),
                        innerFunc.prototype
                    )
                }

                // handle async, generator and async generator
                if (typeof result === 'object' && result !== null) {
                    if (typeof result[Symbol.asyncIterator] === 'function') {
                        result = (async function* (that, args, iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch(that, args, error)
                            }
                        })(this, arguments, result)
                    } else if (typeof result[Symbol.iterator] === 'function') {
                        result = (function* (that, args, iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch(that, args, error)
                            }
                        })(this, arguments, result)
                    } else if (
                        typeof result.then === 'function' &&
                        typeof result.catch === 'function'
                    ) {
                        result = (async function (that, args, prom) {
                            try {
                                return await prom
                            } catch (error) {
                                return innerCatch(that, args, error)
                            }
                        })(this, arguments, result)
                    }
                }

                if (hasCaching) {
                    storeCacheItem(
                        this,
                        Array.from(argsToCache),
                        result,
                        cacheKeys,
                        cacheValues
                    )
                }

                return result
            } catch (error) {
                return innerCatch(this, arguments, error)
            }
        }

        handledFuncs.add(innerFunc)

        return innerFunc
    } catch (error) {
        logError({
            descr: createFuncDescr,
            error,
            args: [props]
        })

        return () => {}
    }
}
