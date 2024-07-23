import { SpecError, isTest } from "../api/constants"
import { anyDef, arrDef, funcDef, idxDef, specDef, strDef } from "../api/definitions"
import { createValidateFunc } from "./createValidateFunc"
import { LIB_ERROR_TEXT, innerLogError } from "./innerConstants"

export const handledFuncs = new WeakMap()

export const tieSpec = [strDef, specDef, funcDef, funcDef]

const toKeys = Object.getOwnPropertyNames

const checkSVZ = (a, b) => a === b || (a !== a && b !== b)

const checkEqual = (a, b) => {
    try {
        if (a === b) {
            return true
        } else if (a && b && a.constructor === b.constructor && (a.constructor === Object || a.constructor === Array)) {
            const objKeys = toKeys(a)
            const objKeysLen = objKeys.length

            if (objKeysLen !== toKeys(b).length) {
                return false
            } else if (objKeysLen === 0) {
                return true
            } else if (objKeysLen === 1) {
                return checkSVZ(a[objKeys[0]], b[objKeys[0]])
            } else {
                for (let m = 0; m < objKeysLen && checkSVZ(a[objKeys[m]], b[objKeys[m]]); m++) {
                    if (m === objKeysLen - 1) return true
                }

                return false
            }
        } else {
            return a !== a && b !== b
        }
    } catch (error) {
        try {
            innerLogError({
                descr: `[checkEqual] ${LIB_ERROR_TEXT}`,
                args: [a, b],
                error,
            })
        } catch {
            // nothing
        }

        return false
    }
}

const getCacheIdxValidate = createValidateFunc([arrDef, arrDef])

export const getCacheIdx = (args, cacheKeys) => {
    if (isTest) {
        const msg = getCacheIdxValidate([args, cacheKeys])

        if (msg !== "") throw new SpecError(`While calling [getCacheIdx]:\n  ${msg}`)
    }

    try {
        const cacheKeysLen = cacheKeys.length

        if (cacheKeysLen === 0) {
            return -1
        }

        const argsLen = args.length

        for (let i = 0; i < cacheKeysLen; i++) {
            const key = cacheKeys[i]

            if (argsLen !== key.length) {
                continue
            } else if (argsLen === 0) {
                return i
            } else if (argsLen === 1) {
                if (checkEqual(key[0], args[0])) return i
            } else {
                for (let m = 0; m < argsLen && checkEqual(key[m], args[m]); m++) {
                    if (m === argsLen - 1) return i
                }
            }
        }

        return -1
    } catch (error) {
        try {
            innerLogError({
                descr: `[getCacheIdx] ${LIB_ERROR_TEXT}`,
                args: [args, cacheKeys],
                error,
            })
        } catch {
            // nothing
        }

        return -1
    }
}

const manageCachePartialValidate = createValidateFunc([arrDef, arrDef])
const manageCacheValidate = createValidateFunc([idxDef, arrDef, anyDef])

export const manageCachePartial = (cacheKeys, cacheValues) => {
    if (isTest) {
        const msg = manageCachePartialValidate([cacheKeys, cacheValues])

        if (msg !== "") {
            throw new SpecError(`While calling [manageCachePartial]:\n  ${msg}`)
        }
    }

    return (idx, key, value) => {
        if (isTest) {
            const msg = manageCacheValidate([idx, key, value])

            if (msg !== "") throw new SpecError(`While calling [manageCache]:\n  ${msg}`)
        }

        try {
            for (let i = idx > 4 ? 4 : idx; i--; ) {
                cacheKeys[i + 1] = cacheKeys[i]
                cacheValues[i + 1] = cacheValues[i]
            }

            cacheKeys[0] = key
            cacheValues[0] = value
        } catch (error) {
            try {
                innerLogError({
                    descr: `[manageCache] ${LIB_ERROR_TEXT}`,
                    args: [idx, key, value],
                    error,
                })
            } catch {
                // nothing
            }
        }
    }
}

const createCurryValidate = createValidateFunc([arrDef, idxDef, funcDef])

export const createCurry = (oldArgs, funcLen, func) => {
    if (isTest) {
        const msg = createCurryValidate([oldArgs, funcLen, func])

        if (msg !== "") throw new SpecError(`While calling [createCurry]:\n  ${msg}`)
    }

    return function (...newArgs) {
        return func.apply(
            this,
            newArgs.length === 0 && funcLen - oldArgs.length === 1
                ? oldArgs.concat([undefined])
                : oldArgs.concat(newArgs)
        )
    }
}
