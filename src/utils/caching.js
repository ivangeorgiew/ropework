import { logError } from './logging'

const isEqual = function (a, b) {
    try {
        return a === b || (a !== a && b !== b)
    } catch (error) {
        logError({
            descr: 'comparing 2 values for caching',
            args: [a, b],
            error
        })

        return false
    }
}

export const getCacheIdx = function (that, args, cacheKeys) {
    try {
        const cacheKeysLen = cacheKeys.length

        if (!cacheKeysLen) {
            return -1
        }

        const argsLen = args.length
        const lastArgsIdx = argsLen - 1

        for (let i = 0; i < cacheKeysLen; i++) {
            const cacheKey = cacheKeys[i]

            if (argsLen !== cacheKey.length || that !== cacheKey.that) {
                continue
            }

            if (argsLen === 0) {
                return i
            } else if (argsLen === 1) {
                if (isEqual(cacheKey[0], args[0])) {
                    return i
                }
            } else {
                for (let m = 0; m < argsLen && isEqual(cacheKey[m], args[m]); m++) {
                    if (m === lastArgsIdx) return i
                }
            }
        }

        return -1
    } catch (error) {
        logError({
            descr: 'searching for existing cache item',
            args: [that, args, cacheKeys],
            error
        })

        return -1
    }
}

export const manageCache = function (i, key, value, cacheKeys, cacheValues) {
    try {
        if (i > 5) {
            i = 5
        }

        while (i--) {
            cacheKeys[i + 1] = cacheKeys[i]
            cacheValues[i + 1] = cacheValues[i]
        }

        cacheKeys[0] = key
        cacheValues[0] = value
    } catch (error) {
        logError({
            descr: 'storing key and value in cache',
            args: [i, key, value, cacheKeys, cacheValues],
            error
        })
    }
}
