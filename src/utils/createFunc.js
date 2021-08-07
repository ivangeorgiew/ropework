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

        const { descr, func } = props
        const { onError, useCache } = props

        if (handledFuncs.has(func)) {
            return func
        }

        const hasCaching = typeof useCache === 'function'
        const [cacheKeys, cacheValues] = [[], []]

        if (typeof useCache === 'function' && !Array.isArray(useCache([]))) {
            throw new Error('useCache must return an array')
        }

        let isNextCallFirst = true

        const innerCatch = function (args, error, isFirstCall) {
            if (!isFirstCall) {
                cacheKeys.length = cacheValues.length = 0
                throw error
            }

            logError({ descr, error, args })

            if (hasCaching) {
                try {
                    const argsToCache = useCache(args)
                    const cacheIdx = getCacheIdx(argsToCache, cacheKeys)

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
                    return onError({ descr, args, error })
                } catch (error) {
                    logError({ descr: `catching errors for ${descr}`, args, error })
                }
            }
        }

        const innerFunc = function (...args) {
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
                        result = (async function* (ifc, iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch(args, error, ifc)
                            }
                        })(isFirstCall, result)
                    } else if (typeof result[Symbol.iterator] === 'function') {
                        result = (function* (ifc, iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch(args, error, ifc)
                            }
                        })(isFirstCall, result)
                    } else if (typeof result.then === 'function') {
                        result = (async function (ifc, prom) {
                            try {
                                return await prom
                            } catch (error) {
                                return innerCatch(args, error, ifc)
                            }
                        })(isFirstCall, result)
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
                result = innerCatch(args, error, isFirstCall)
            }

            if (isFirstCall) {
                isNextCallFirst = true
            }

            return result
        }

        handledFuncs.add(innerFunc)

        return innerFunc
    } catch (error) {
        logError({ descr: createFuncDescr, error, args: [props] })

        return () => {}
    }
}
