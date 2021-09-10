import { arrDef } from "../api/definitions"
import { createValidateFunc } from "./createValidateFunc"
import { innerLogError, isTest } from "./generics"

export const handledFuncs = new WeakMap()

const toKeys = a => [
    ...Object.getOwnPropertyNames(a),
    ...Object.getOwnPropertySymbols(a),
]

const checkSVZ = (a, b) => a === b || (a !== a && b !== b)

const checkEqual = (a, b) => {
    try {
        if (a === b) {
            return true
        } else if (
            a &&
            b &&
            a.constructor === b.constructor &&
            typeof a === "object"
        ) {
            const ac = a.constructor

            if (ac === undefined || ac === Object || ac === Array) {
                const objKeys = toKeys(a)
                const objKeysLen = objKeys.length

                if (objKeysLen !== toKeys(b).length) {
                    return false
                } else if (objKeysLen === 0) {
                    return true
                } else if (objKeysLen === 1) {
                    return checkSVZ(a[objKeys[0]], b[objKeys[0]])
                } else {
                    for (
                        let m = 0;
                        m < objKeysLen && checkSVZ(a[objKeys[m]], b[objKeys[m]]);
                        m++
                    ) {
                        if (m === objKeysLen - 1) return true
                    }

                    return false
                }
            } else {
                return false
            }
        } else {
            return a !== a && b !== b
        }
    } catch (error) {
        if (isTest) {
            try {
                innerLogError({ descr: "checkEqual", args: [a, b], error })
            } catch {
                // nothing
            }
        }

        return false
    }
}

const getCacheIdxSpec = [arrDef, arrDef]
const getCacheIdxValidate = createValidateFunc(getCacheIdxSpec)

export const getCacheIdx = (args, cacheKeys) => {
    try {
        if (isTest) {
            getCacheIdxValidate(args, cacheKeys)
        }

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
        if (isTest) {
            try {
                innerLogError({
                    descr: "getCacheIdx",
                    args: [args, cacheKeys],
                    error,
                })
            } catch {
                // nothing
            }
        }

        return -1
    }
}
