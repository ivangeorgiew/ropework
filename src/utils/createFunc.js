import { isDev } from "../api/constants"
import {
    arrDef,
    createDef,
    errorDef,
    funcDef,
    idxDef,
    specDef,
    strDef,
} from "../api/definitions"
import { getCacheIdx, handledFuncs } from "./createFuncHelpers"
import { createValidateFunc } from "./createValidateFunc"
import { innerLogError, isTest } from "./generics"
import { logError } from "./logging"

const isPureDef = /*#__PURE__*/ createDef({
    getMsg: arg =>
        typeof arg !== "boolean" && arg !== undefined
            ? "must be boolean or undefined"
            : "",
})

export const tieSpec = [strDef, specDef, funcDef, funcDef]

const createFuncSpec = [...tieSpec, isPureDef]
const createFuncValidate = createValidateFunc(createFuncSpec)

const manageCacheSpec = [idxDef, arrDef]
const manageCacheValidate = createValidateFunc(manageCacheSpec)

const innerCatchSpec = [arrDef, errorDef]
const innerCatchValidate = createValidateFunc(innerCatchSpec)

export const createFunc = (descr, spec, onError, func, isPure) => {
    try {
        if (isTest) {
            createFuncValidate(descr, spec, onError, func, isPure)
        }

        if (handledFuncs.has(func)) {
            return func
        }

        const validateArgs = createValidateFunc(spec)
        const funcLen = func.length
        const cacheKeys = []
        const cacheValues = []

        let isNextCallFirst = true

        const manageCache = (_idx, key, value) => {
            try {
                if (isTest) {
                    manageCacheValidate(_idx, key, value)
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
                        innerLogError({
                            descr: "manageCache",
                            args: [_idx, key, value],
                            error,
                        })
                    } catch {
                        // nothing
                    }
                }
            }
        }

        const innerCatch = (args, error) => {
            try {
                if (isTest) {
                    innerCatchValidate(args, error)
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
                        innerLogError({
                            descr: "innerCatch",
                            args: [args, error],
                            error,
                        })
                    } catch {
                        // nothing
                    }
                }

                return undefined
            }
        }

        const getCurry = args =>
            function (...newArgs) {
                try {
                    const allArgs =
                        newArgs.length === 0 && funcLen - args.length === 1
                            ? args.concat([undefined])
                            : args.concat(newArgs)

                    try {
                        // eslint-disable-next-line no-use-before-define
                        return innerFunc.apply(this, allArgs)
                    } catch (error) {
                        return innerCatch(allArgs, error)
                    }
                } catch (error) {
                    return innerCatch(args, error)
                }
            }

        const innerFunc = function (...args) {
            let isFirstCall
            let shouldStore
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

                if (isDev) {
                    validateArgs(...args)
                }

                // normal call or constructor
                if (new.target === undefined) {
                    if (args.length < funcLen) {
                        shouldStore = true
                        result = getCurry(args)
                    } else {
                        shouldStore = isPure
                        result = func.apply(this, args)
                    }
                } else {
                    shouldStore = isPure
                    result = new func(...args)
                }

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

                if (shouldStore) {
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

        handledFuncs.set(innerFunc, {
            descr,
            spec,
            onError,
            func,
            cacheKeys,
            cacheValues,
        })

        return innerFunc
    } catch (error) {
        if (isTest) {
            try {
                innerLogError({
                    descr: "createFunc",
                    args: [descr, spec, onError, func, isPure],
                    error,
                })
            } catch {
                // nothing
            }
        }

        return () => {}
    }
}
