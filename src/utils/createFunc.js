import { defaultDescr, handledFuncs } from '../options'
import { logError } from './logging'
import { parseArgTypes, validateArgs } from './validation'

const searchCache = function ({ cacheArgs, cacheItem, cacheProps }) {
    if (!Array.isArray(cacheArgs)) {
        throw new Error('useCache must return an array')
    }

    cacheArgs = [this].concat(cacheArgs)

    let i = -1

    while (cacheArgs.length - ++i) {
        let storageKey =
            cacheArgs[i] !== null &&
            ['object', 'function'].includes(typeof cacheArgs[i])
                ? 'references'
                : 'primitives'

        if (
            storageKey in cacheItem &&
            cacheItem[storageKey].has(cacheArgs[i])
        ) {
            cacheItem = cacheItem[storageKey].get(cacheArgs[i])
        } else {
            break
        }
    }

    Object.assign(cacheProps, {
        hasHit: i === cacheArgs.length && 'result' in cacheItem,
        cacheArgs: cacheArgs.slice(i),
        cacheItem
    })
}

const storeResult = function ({ result, cacheProps }) {
    let { cacheArgs, cacheItem } = cacheProps
    let i = -1

    while (cacheArgs.length - ++i) {
        const storageKey =
            cacheArgs[i] !== null &&
            ['object', 'function'].includes(typeof cacheArgs[i])
                ? 'references'
                : 'primitives'

        if (!(storageKey in cacheItem)) {
            cacheItem[storageKey] =
                storageKey === 'references' ? new WeakMap() : new Map()
        }

        cacheItem = cacheItem[storageKey].has(cacheArgs[i])
            ? cacheItem[storageKey].get(cacheArgs[i])
            : cacheItem[storageKey].set(cacheArgs[i], {}).get(cacheArgs[i])
    }

    cacheItem.result = result

    Object.assign(cacheProps, { hasHit: true, cacheArgs, cacheItem })
}

export const createFunc = function (props) {
    try {
        // validate args for createFunc
        validateArgs({
            types: parseArgTypes({
                descr: props?.descr ?? defaultDescr,
                argTypes: `{
                    :descr: str,
                    :argTypes: str | undef,
                    :onError: () | undef,
                    :useCache: () | undef,
                    :data: any
                }`
            }),
            args: [props]
        })

        const { descr, data, argTypes = '' } = props
        const { onError = () => {}, useCache } = props

        if (handledFuncs.has(data)) {
            return data
        }

        let unfinishedCalls = 0

        const types = parseArgTypes({ descr, argTypes })
        const hasCaching = typeof useCache === 'function'

        const innerCatch = function ({ error, args, cacheProps }) {
            if (hasCaching && cacheProps.hasHit) {
                delete cacheProps.cacheItem.result
            }

            if (unfinishedCalls > 1) {
                throw error
            }

            logError({ descr, error, args })

            try {
                return onError({ descr, args, error })
            } catch (error) {
                logError({
                    descr: `catching errors for ${descr}`,
                    args,
                    error
                })
            }
        }

        const innerFunc = function (...args) {
            const cacheProps = {}
            let result

            try {
                unfinishedCalls++

                // retrieve result from cache
                if (hasCaching) {
                    searchCache.call(this, {
                        cacheArgs: useCache(args),
                        cacheItem: handledFuncs.get(innerFunc),
                        cacheProps
                    })

                    if (cacheProps.hasHit) {
                        return cacheProps.cacheItem.result
                    }
                }

                validateArgs({ types, args })

                if (new.target === undefined) {
                    result = data.apply(this, args)
                } else {
                    result = Object.setPrototypeOf(
                        new data(...args),
                        innerFunc.prototype
                    )
                }

                // handle async, generator and async generator
                if (result !== null && typeof result === 'object') {
                    if (typeof result[Symbol.asyncIterator] === 'function') {
                        result = (async function* (iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch({ error, args, cacheProps })
                            }
                        })(result)
                    } else if (typeof result[Symbol.iterator] === 'function') {
                        result = (function* (iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch({ error, args, cacheProps })
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
                                return innerCatch({ error, args, cacheProps })
                            }
                        })(result)
                    }
                }

                if (hasCaching) {
                    storeResult({ result, cacheProps })
                }

                return result
            } catch (error) {
                return innerCatch({ error, args, cacheProps })
            } finally {
                unfinishedCalls--
            }
        }

        handledFuncs.set(innerFunc, hasCaching ? {} : true)

        return innerFunc
    } catch (error) {
        logError({
            descr: 'creating error-handled function',
            error,
            args: [props]
        })

        return () => {}
    }
}
