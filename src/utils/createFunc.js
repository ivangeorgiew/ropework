import { isDev, isTest } from "../api/constants"
import {
    checkArr,
    checkBool,
    checkFunc,
    checkIdx,
    checkNil,
    validateArgs,
    checkStr,
} from "../api/validating"
import { getCacheIdx, handledFuncs } from "./createFuncHelpers"
import { logErrorDefault } from "./helpers"
import { logError } from "./logging"

const createFuncSpec = [
    [arg => checkStr(arg) && arg.length > 2, "must be string longer than 2"],
    [checkFunc, "must be function"],
    [checkFunc, "must be function"],
    [arg => checkNil(arg) || checkBool(arg), "must be boolean or undefined"],
]

const manageCacheSpec = [
    [checkIdx, "must be valid index"],
    [checkArr, "must be array"],
]

const innerCatchSpec = [
    [checkArr, "must be array"],
    [arg => arg instanceof Error, "must be Error"],
]

const getCurrySpec = [[checkArr, "must be array"]]

export const createFunc = (descr, onError, func, isPure) => {
    try {
        if (isTest) {
            validateArgs(createFuncSpec, [descr, onError, func, isPure])
        }

        if (handledFuncs.has(func)) {
            return func
        }

        const funcLen = func.length
        const cacheKeys = []
        const cacheValues = []

        let isNextCallFirst = true

        const manageCache = (_idx, key, value) => {
            try {
                if (isTest) {
                    validateArgs(manageCacheSpec, [_idx, key, value])
                }

                let idx = _idx > 5 ? 5 : _idx

                while (idx--) {
                    cacheKeys[idx + 1] = cacheKeys[idx]
                    cacheValues[idx + 1] = cacheValues[idx]
                }

                cacheKeys[0] = key
                cacheValues[0] = value
            } catch (error) {
                if (isTest) {
                    try {
                        logErrorDefault({
                            descr: "manageCache",
                            args: [_idx, key, value],
                            error,
                        })
                    } catch (_e) {
                        // nothing
                    }
                }
            }
        }

        const innerCatch = (args, error) => {
            try {
                if (isTest) {
                    validateArgs(innerCatchSpec, [args, error])
                }

                logError({ descr, error, args })

                try {
                    return onError({ descr, args, error })
                } catch (error) {
                    logError({
                        descr: `handling errors for [${descr}]`,
                        args: [{ descr, args, error }],
                        error,
                    })

                    return undefined
                }
            } catch (error) {
                if (isTest) {
                    try {
                        logErrorDefault({
                            descr: "innerCatch",
                            args: [args, error],
                            error,
                        })
                    } catch (_e) {
                        // nothing
                    }
                }

                return undefined
            }
        }

        const getCurry = args => {
            try {
                if (isTest) {
                    validateArgs(getCurrySpec, [args])
                }

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
                if (isTest) {
                    try {
                        logErrorDefault({ descr: "getCurry", args: [args], error })
                    } catch (_e) {
                        // nothing
                    }
                }

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
                if (typeof result === "object" && result !== null) {
                    if (typeof result[Symbol.asyncIterator] === "function") {
                        shouldStore = false
                        result = (async function* (iter) {
                            try {
                                const res = yield* iter

                                if (isPure) {
                                    manageCache(cacheKeys.length, args, iter)
                                }

                                return res
                            } catch (error) {
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    } else if (typeof result[Symbol.iterator] === "function") {
                        shouldStore = false
                        result = (function* (iter) {
                            try {
                                const res = yield* iter

                                if (isPure) {
                                    manageCache(cacheKeys.length, args, iter)
                                }

                                return res
                            } catch (error) {
                                if (!isFirstCall) throw error
                                return innerCatch(args, error)
                            }
                        })(result)
                    } else if (typeof result.then === "function") {
                        shouldStore = false
                        result = (async function (prom) {
                            try {
                                const res = await prom

                                if (isPure) {
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

                if (isPure && shouldStore) {
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
            Object.defineProperty(innerFunc, "name", {
                value: `[${descr}]`,
                configurable: true,
            })
        }

        handledFuncs.set(innerFunc, { cacheKeys, cacheValues })

        return innerFunc
    } catch (error) {
        if (isTest) {
            try {
                logErrorDefault({
                    descr: "createFunc",
                    args: [descr, onError, func, isPure],
                    error,
                })
            } catch (_e) {
                // nothing
            }
        }

        return () => {}
    }
}
