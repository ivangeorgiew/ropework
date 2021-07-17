import { logError } from './logging'

// TODO different implementation? add clearCache?
const alreadyHandled = new WeakSet()
const caches = new WeakMap()

export const createFunc = function (descr, func, options) {
    try {
        options = Object.assign({}, options)

        // TODO: add 'types = []' and validate them
        const { onError = () => {}, useCache } = options

        if (typeof descr !== 'string') {
            throw new TypeError(`${descr} - First arg must be a string`)
        }

        if (typeof func !== 'function') {
            throw new TypeError(`"${descr}" must be a function`)
        }

        if (typeof onError !== 'function') {
            throw new TypeError(`${descr} - onError must be a function`)
        }

        if (useCache !== undefined && typeof useCache !== 'function') {
            throw new TypeError(`${descr} - useCache must be a function`)
        }

        // TODO
        // if (!Array.isArray(types)) {
        //     throw new TypeError(`${descr} - types must be an array`)
        // }

        if (alreadyHandled.has(func)) {
            return func
        }

        let unfinishedCalls = 0

        const innerCatch = function ({ error, args }) {
            if (unfinishedCalls > 1) {
                throw error
            }

            logError({ descr, error, args })

            try {
                return onError({ descr, args, error })
            } catch (err) {
                logError({
                    descr: `catching errors for ${descr}`,
                    args,
                    error: err
                })
            }
        }

        const innerFunc = function (...args) {
            try {
                unfinishedCalls++

                let result, cacheItem, cacheArgs, storageKey, i

                // retrieve result from cache
                if (typeof useCache === 'function') {
                    try {
                        cacheArgs = useCache(args)
                    } catch (error) {
                        logError({
                            descr: `creating a cache key for ${descr}`,
                            args,
                            error
                        })
                    }

                    if (Array.isArray(cacheArgs)) {
                        if (!caches.has(innerFunc)) {
                            caches.set(innerFunc, {})
                        }

                        cacheArgs = [this].concat(cacheArgs)
                        cacheItem = caches.get(innerFunc)
                        i = -1

                        while (cacheArgs.length - ++i) {
                            storageKey =
                                cacheArgs[i] !== null &&
                                ['object', 'function'].includes(
                                    typeof cacheArgs[i]
                                )
                                    ? 'references'
                                    : 'primitives'

                            if (
                                storageKey in cacheItem &&
                                cacheItem[storageKey].has(cacheArgs[i])
                            ) {
                                cacheItem = cacheItem[storageKey].get(
                                    cacheArgs[i]
                                )
                            } else {
                                break
                            }
                        }

                        if (i === cacheArgs.length && 'result' in cacheItem) {
                            return cacheItem.result
                        }

                        // save on loop time
                        cacheArgs.splice(0, i)
                    }
                }

                // regular function call
                if (new.target === undefined) {
                    result = func.apply(this, args)
                    // creating an object with constructor
                } else {
                    result = (function (Constr) {
                        return Object.create(
                            innerFunc.prototype,
                            Object.getOwnPropertyDescriptors(
                                new Constr(...args)
                            )
                        )
                    })(func)
                }

                // handle async, generator and async generator
                if (result !== null && typeof result === 'object') {
                    // the function returns an async iterator
                    if (typeof result[Symbol.asyncIterator] === 'function') {
                        result = (async function* (iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch({ error, args })
                            }
                        })(result)
                        // the function returns an iterator
                    } else if (typeof result[Symbol.iterator] === 'function') {
                        result = (function* (iter) {
                            try {
                                return yield* iter
                            } catch (error) {
                                return innerCatch({ error, args })
                            }
                        })(result)
                        // the function returns a promise
                    } else if (
                        typeof result.then === 'function' &&
                        typeof result.catch === 'function'
                    ) {
                        result = (async function (prom) {
                            try {
                                return await prom
                            } catch (error) {
                                return innerCatch({ error, args })
                            }
                        })(result)
                    }
                }

                // save the result in cache
                if (Array.isArray(cacheArgs)) {
                    i = -1

                    while (cacheArgs.length - ++i) {
                        storageKey =
                            cacheArgs[i] !== null &&
                            ['object', 'function'].includes(typeof cacheArgs[i])
                                ? 'references'
                                : 'primitives'

                        if (!(storageKey in cacheItem)) {
                            cacheItem[storageKey] =
                                storageKey === 'references'
                                    ? new WeakMap()
                                    : new Map()
                        }

                        cacheItem = cacheItem[storageKey].has(cacheArgs[i])
                            ? cacheItem[storageKey].get(cacheArgs[i])
                            : cacheItem[storageKey]
                                  .set(cacheArgs[i], {})
                                  .get(cacheArgs[i])
                    }

                    cacheItem.result = result
                }

                return result
            } catch (error) {
                return innerCatch({ error, args })
            } finally {
                unfinishedCalls--
            }
        }

        alreadyHandled.add(innerFunc)

        return innerFunc
    } catch (error) {
        logError({
            descr: 'creating error-handled function',
            error,
            args: [descr, func, options]
        })

        return () => {}
    }
}
