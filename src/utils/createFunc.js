import { isDev, isTest } from "../api/constants"
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
import { innerLogError } from "./innerConstants"
import { logError } from "./logging"

const isPureDef = /*#__PURE__*/ createDef({
    getMsg: arg =>
        typeof arg !== "boolean" && arg !== undefined
            ? "must be boolean or undefined"
            : "",
})

export const tieSpec = [strDef, specDef, funcDef, funcDef]

const createFuncValidate = createValidateFunc([...tieSpec, isPureDef])
const manageCacheValidate = createValidateFunc([idxDef, arrDef])
const innerCatchValidate = createValidateFunc([arrDef, errorDef])

export const createFunc = (descr, spec, onTry, onCatch, isPure) => {
    try {
        if (isTest) {
            createFuncValidate([descr, spec, onTry, onCatch, isPure])
        }

        if (handledFuncs.has(onTry)) {
            return onTry
        }

        const validateArgs = createValidateFunc(spec)
        const funcLen = onTry.length
        const cacheKeys = []
        const cacheValues = []

        let isNextCallFirst = true

        const manageCache = (_idx, key, value) => {
            try {
                if (isTest) {
                    manageCacheValidate([_idx, key, value])
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
                    try {
                        innerCatchValidate([args, error])
                    } catch (error) {
                        try {
                            innerLogError({
                                descr: "innerCatch",
                                args: [args, error],
                                error,
                            })
                        } catch {
                            // nothing
                        }

                        return undefined
                    }
                }

                logError({ descr, error, args })

                try {
                    return onCatch({ descr, args, error })
                } catch (error) {
                    logError({
                        descr: `handling errors for [${descr}]`,
                        args: [{ descr, args, error }],
                        error,
                    })

                    return undefined
                }
            } catch {
                throw error
            }
        }

        const getCurry = oldArgs =>
            function (...newArgs) {
                const args =
                    newArgs.length === 0 && funcLen - oldArgs.length === 1
                        ? oldArgs.concat([undefined])
                        : oldArgs.concat(newArgs)

                // eslint-disable-next-line no-use-before-define
                return innerFunc.apply(this, args)
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

                // normal call or constructor
                if (new.target === undefined) {
                    if (args.length < funcLen) {
                        if (isDev) {
                            try {
                                validateArgs(args)
                            } catch (error) {
                                logError({ descr, error, args })
                            }
                        }

                        shouldStore = true
                        result = getCurry(args)
                    } else {
                        if (isDev) validateArgs(args)

                        shouldStore = isPure
                        result = onTry.apply(this, args)
                    }
                } else {
                    if (isDev) validateArgs(args)

                    shouldStore = isPure
                    result = new onTry(...args)
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
            onTry,
            onCatch,
            cacheKeys,
            cacheValues,
        })

        return innerFunc
    } catch (error) {
        if (isTest) {
            try {
                innerLogError({
                    descr: "createFunc",
                    args: [descr, spec, onTry, onCatch, isPure],
                    error,
                })
            } catch {
                // nothing
            }
        }

        return () => {}
    }
}
