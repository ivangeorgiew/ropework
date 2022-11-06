import { createValidateFunc } from "../utils/createValidateFunc"
import { innerLogError, options } from "../utils/innerConstants"
import { logError } from "../utils/logging"
import {
    createCurry,
    getCacheIdx,
    handledFuncs,
    manageCachePartial,
    tieSpec,
} from "../utils/tyingHelpers"
import { SpecError, isDev, isTest } from "./constants"
import { arrDef, errorDef } from "./definitions"

const tieValidate = createValidateFunc(tieSpec)
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

        const funcLen = onTry.length
        const cacheKeys = []
        const cacheValues = []
        const manageCache = manageCachePartial(cacheKeys, cacheValues)
        const validateArgs = createValidateFunc(spec)

        let isNextCallFirst = true
        let areArgsValid = true

        const innerCatch = (args, error, isFirstCall) => {
            if (isTest) {
                try {
                    innerCatchValidate([args, error])
                } catch (e) {
                    try {
                        innerLogError({
                            descr: "[innerCatch] from library tied-up",
                            args: [args, error],
                            error: e,
                        })
                    } catch {
                        // nothing
                    }

                    throw e
                }
            }

            if (!isFirstCall || !areArgsValid) throw error

            try {
                isNextCallFirst = true

                logError({ descr, error, args })
            } catch {
                // nothing
            }

            // ability to manually throw from onCatch
            return onCatch({ descr, args, error })
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
                    areArgsValid = true

                    const msg = validateArgs(args)

                    if (msg !== "") {
                        areArgsValid = false

                        throw new SpecError(`at [${descr}], ${msg}`)
                    }
                }

                // normal call or constructor
                if (new.target === undefined) {
                    if (funcLen > 1 && args.length < funcLen) {
                        shouldStore = true
                        result = createCurry(args, funcLen, innerFunc)
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
                                return innerCatch(args, error, isFirstCall)
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
                                return innerCatch(args, error, isFirstCall)
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
                                return innerCatch(args, error, isFirstCall)
                            }
                        })(result)
                    }
                }

                isNextCallFirst = true

                if (shouldStore) {
                    manageCache(cacheKeys.length, args, result)
                }

                return result
            } catch (error) {
                return innerCatch(args, error, isFirstCall)
            }
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
                descr: "[tie] from library tied-up",
                args: [props],
                error,
            })
        } catch {
            // nothing
        }

        return () => {}
    }
}
