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
import { innerLogError, options } from "./innerConstants"
import { logError } from "./logging"

const isPureDef = createDef({
    getMsg: arg =>
        typeof arg !== "boolean" && arg !== undefined
            ? "must be boolean or undefined"
            : "",
})

export const tieSpec = [
    createDef({
        strictProps: {
            descr: strDef,
            onTry: funcDef,
        },
        props: {
            onCatch: funcDef,
            spec: specDef,
            isPure: isPureDef,
        },
    }),
]

const createFuncValidate = createValidateFunc([...tieSpec, isPureDef])
const manageCacheValidate = createValidateFunc([idxDef, arrDef])
const innerCatchValidate = createValidateFunc([arrDef, errorDef])

export const createFunc = props => {
    try {
        if (isTest) {
            createFuncValidate([props])
        }

        const { descr, onTry, onCatch = () => {}, spec = [], isPure = false } = props

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
            if (isTest) {
                try {
                    innerCatchValidate([args, error])
                } catch (e) {
                    try {
                        innerLogError({
                            descr: "innerCatch",
                            args: [args, error],
                            error: e,
                        })
                    } catch {
                        // nothing
                    }

                    throw e
                }
            }

            try {
                logError({ descr, error, args })
            } catch {
                // nothing
            }

            // ability to throw from onCatch when no proper result can be given
            return onCatch({ descr, args, error })
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

                if (isDev && options.shouldValidate) {
                    try {
                        validateArgs(args)
                    } catch (error) {
                        logError({ descr, error, args })
                    }
                }

                // normal call or constructor
                if (new.target === undefined) {
                    if (args.length < funcLen) {
                        shouldStore = true
                        result = getCurry(args)
                    } else {
                        shouldStore = isPure
                        result = onTry.apply(this, args)
                    }
                } else {
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

                                isNextCallFirst = true

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

                                isNextCallFirst = true

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

                                isNextCallFirst = true

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

                isNextCallFirst = true
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

        handledFuncs.set(innerFunc, { ...props })

        return innerFunc
    } catch (error) {
        if (isTest) {
            try {
                innerLogError({
                    descr: "createFunc",
                    args: [props],
                    error,
                })
            } catch {
                // nothing
            }
        }

        return () => {}
    }
}
