import { isTest } from "../api/constants"
import { checkArr, validateArgs } from "../api/validating"
import { logErrorDefault } from "./helpers"

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
        } else if (a && b && a.constructor === b.constructor) {
            if (a.constructor !== Object && a.constructor !== Array) {
                return false
            } else {
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
            }
        } else {
            return a !== a && b !== b
        }
    } catch (error) {
        if (isTest) {
            logErrorDefault({ descr: "checkEqual", args: [a, b], error })
        }

        return false
    }
}

const getCacheIdxSpec = [
    [checkArr, "First arg must be array"],
    [checkArr, "Second arg must be array"],
]

export const getCacheIdx = (args, cacheKeys) => {
    try {
        if (isTest) {
            validateArgs(getCacheIdxSpec, [args, cacheKeys])
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
            logErrorDefault({ descr: "getCacheIdx", args: [args, cacheKeys], error })
        }

        return -1
    }
}
