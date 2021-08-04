import { getCacheIdx, manageCache } from './caching'
import { logError } from './logging'
import { parseArgTypes, validateArgs } from './validation'

// TODO: add validation, it is currently slow during caching
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
        const parsedArgTypes = hasValidation ? parseArgTypes(descr, argTypes) : []

        if (typeof useCache === 'function' && !Array.isArray(useCache([]))) {
            throw new Error('useCache must return an array')
        }

        const shouldTransformArgs = typeof useCache === 'function'
        const hasCaching = shouldTransformArgs || useCache === true
        const [cacheKeys, cacheValues] = [[], []]

        let isNextCallFirst = true

        const innerCatch = function (that, args, error, isFirstCall) {
            // performance check for undefined or false
            if (!isFirstCall) {
                cacheKeys.length = cacheValues.length = 0
                throw error
            }

            logError({ descr, error, args })

            if (hasCaching) {
                try {
                    const argsToCache = shouldTransformArgs ? useCache(args) : args
                    const cacheIdx = argsToCache.length
                        ? getCacheIdx(that, argsToCache, cacheKeys)
                        : -1

                    if (cacheIdx !== -1) {
                        cacheKeys.splice(cacheIdx, 1)
                        cacheValues.splice(cacheIdx, 1)
                    }
                } catch (err) {
                    cacheKeys.length = cacheValues.length = 0
                }
            }

            if (typeof onError === 'function') {
                try {
                    return onError.call(that, { descr, args, error })
                } catch (error) {
                    logError({ descr: `catching errors for ${descr}`, args, error })
                }
            }
        }

        const innerFunc = function (...args) {
            // isFirstCall starts as undefined for performance
            let isFirstCall, result, argsToCache

            try {
                if (hasCaching) {
                    argsToCache = shouldTransformArgs ? useCache(args) : args

                    const cacheIdx = cacheKeys.length
                        ? getCacheIdx(this, argsToCache, cacheKeys)
                        : -1

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

                if (isNextCallFirst) {
                    isFirstCall = true
                    isNextCallFirst = false
                }

                if (hasValidation) {
                    if (!validateArgs(parsedArgTypes, args)) {
                        throw new Error(`Wrong arguments for ${descr}`)
                    }
                }

                if (new.target === undefined) {
                    result = func.apply(this, args)
                } else {
                    result = Object.setPrototypeOf(
                        new func(...args),
                        innerFunc.prototype
                    )
                }

                // handle async, generator and async generator
                if (typeof result === 'object' && result !== null) {
                    if (typeof result[Symbol.asyncIterator] === 'function') {
                        result = (async function* (that, iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch(that, args, error, isFirstCall)
                            }
                        })(this, result)
                    } else if (typeof result[Symbol.iterator] === 'function') {
                        result = (function* (that, iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch(that, args, error, isFirstCall)
                            }
                        })(this, result)
                    } else if (typeof result.then === 'function') {
                        result = (async function (that, prom) {
                            try {
                                return await prom
                            } catch (error) {
                                return innerCatch(that, args, error, isFirstCall)
                            }
                        })(this, result)
                    }
                }

                if (hasCaching) {
                    argsToCache.that = this

                    manageCache(
                        cacheKeys.length,
                        argsToCache,
                        result,
                        cacheKeys,
                        cacheValues
                    )
                }
            } catch (error) {
                result = innerCatch(this, args, error, isFirstCall)
            }

            isNextCallFirst = true

            return result
        }

        handledFuncs.add(innerFunc)

        return innerFunc
    } catch (error) {
        logError({ descr: createFuncDescr, error, args: [props] })

        return () => {}
    }
}
