import { createValidateFunc } from "../utils/createValidateFunc"
import { innerLogError, options } from "../utils/innerConstants"
import { logError } from "../utils/logging"
import { getCacheIdx, handledFuncs, tieSpec } from "../utils/tyingHelpers"
import { isDev, isTest } from "./constants"
import { arrDef, errorDef, idxDef } from "./definitions"

const tieValidate = createValidateFunc(tieSpec)
const manageCacheValidate = createValidateFunc([idxDef, arrDef])
const innerCatchValidate = createValidateFunc([arrDef, errorDef])

export const tie = props => {
    try {
        if (isTest) {
            tieValidate([props])
        }

        const { descr, onTry, onCatch, spec = [], isPure = false } = props

        if (handledFuncs.has(onTry)) {
            return onTry
        }

        const validateArgs = createValidateFunc(spec)
        const funcLen = onTry.length
        const cacheKeys = []
        const cacheValues = []

        let isNextCallFirst = true
        let areArgsValid = true

        const manageCache = (idx, key, value) => {
            try {
                if (isTest) {
                    manageCacheValidate([idx, key, value])
                }

                for (let i = idx > 4 ? 4 : idx; i--; ) {
                    cacheKeys[i + 1] = cacheKeys[i]
                    cacheValues[i + 1] = cacheValues[i]
                }

                cacheKeys[0] = key
                cacheValues[0] = value
            } catch (error) {
                try {
                    innerLogError({
                        descr: "[manageCache] from the library",
                        args: [idx, key, value],
                        error,
                    })
                } catch {
                    // nothing
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
                            descr: "[innerCatch] from the library",
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

            // ability to manually throw from onCatch
            return onCatch({ descr, args, error, areArgsValid })
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

                if (options.shouldValidate && spec.length > 0) {
                    areArgsValid = false
                    validateArgs(args)
                    areArgsValid = true
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

        handledFuncs.set(innerFunc, { ...props, cacheKeys, cacheValues })

        return innerFunc
    } catch (error) {
        try {
            innerLogError({
                descr: "[tie] from the library",
                args: [props],
                error,
            })
        } catch {
            // nothing
        }

        return () => {}
    }
}
