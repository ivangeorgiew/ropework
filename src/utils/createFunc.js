import { logError } from './logging'
import { parseArgTypes, validateArgs } from './validation'

// TODO: add validation, it is currently slow during caching
// TODO: unfinishedCalls is not working for async/gen functions? (try async recursion)
const createFuncDescr = 'creating an error-handled function'

const handledFuncs = new WeakSet()

const isEqual = function (a, b) {
    return a === b || (a !== a && b !== b)
}

const getCacheIdx = function (that, args, cacheKeys) {
    const cacheKeysLen = cacheKeys.length

    if (cacheKeysLen === 0) {
        return -1
    }

    const argsLen = args.length
    const lastArgsIdx = argsLen - 1

    for (let i = 0; i < cacheKeysLen; i++) {
        const cacheKey = cacheKeys[i]

        if (argsLen !== cacheKey.length || that !== cacheKey.that) {
            continue
        }

        switch (argsLen) {
            case 0: {
                return i
            }
            case 1: {
                if (isEqual(cacheKey[0], args[0])) {
                    return i
                }
                break
            }
            default: {
                for (
                    let m = 0;
                    m < argsLen && isEqual(cacheKey[m], args[m]);
                    m++
                ) {
                    if (m === lastArgsIdx) return i
                }
            }
        }
    }

    return -1
}

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

        const storeOrReorder = function (that, key, value, idxToReorder) {
            if (idxToReorder) {
                cacheKeys.splice(idxToReorder, 1)
                cacheValues.splice(idxToReorder, 1)
            } else {
                key.that = that

                if (cacheKeys.length === 5) {
                    cacheKeys.pop()
                    cacheValues.pop()
                }
            }

            cacheKeys.unshift(key)
            cacheValues.unshift(value)
        }

        const innerCatch = function (error, args) {
            unfinishedCalls = unfinishedCalls + 1

            if (unfinishedCalls > 1) {
                cacheKeys.length = cacheValues.length = 0
                throw error
            }

            args = Array.from(args)

            logError({ descr, error, args })

            try {
                if (hasCaching) {
                    const cacheIdx = getCacheIdx(
                        this,
                        useCache(args),
                        cacheKeys
                    )

                    if (cacheIdx !== -1) {
                        cacheKeys.splice(cacheIdx, 1)
                        cacheValues.splice(cacheIdx, 1)
                    }
                }

                if (hasOnError) {
                    return onError.call(this, { descr, args, error })
                }
            } catch (error) {
                logError({
                    descr: `catching errors for ${descr}`,
                    args,
                    error
                })
            } finally {
                unfinishedCalls = unfinishedCalls - 1
            }
        }

        const innerFunc = function () {
            let result, argsToCache, cacheIdx

            try {
                if (hasCaching) {
                    argsToCache = useCache(arguments)
                    cacheIdx = getCacheIdx(this, argsToCache, cacheKeys)

                    if (cacheIdx !== -1) {
                        if (cacheIdx !== 0) {
                            storeOrReorder(
                                this,
                                cacheKeys[cacheIdx],
                                cacheValues[cacheIdx],
                                cacheIdx
                            )
                        }

                        return cacheValues[0]
                    }
                }

                if (hasValidation) {
                    if (!validateArgs(parsedArgTypes, arguments)) {
                        throw new Error(`Wrong arguments for ${descr}`)
                    }
                }

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
                    const args = arguments

                    if (typeof result[Symbol.asyncIterator] === 'function') {
                        result = (async function* (iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch.call(this, error, args)
                            }
                        })(result)
                    } else if (typeof result[Symbol.iterator] === 'function') {
                        result = (function* (iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch.call(this, error, args)
                            }
                        })(result)
                    } else if (
                        typeof result.then === 'function' &&
                        typeof result.catch === 'function'
                    ) {
                        result = (async function (prom) {
                            try {
                                return await prom
                            } catch (error) {
                                return innerCatch.call(this, error, args)
                            }
                        })(result)
                    }
                }

                if (hasCaching) {
                    storeOrReorder(this, Array.from(argsToCache), result)
                }

                return result
            } catch (error) {
                return innerCatch.call(this, error, arguments)
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
