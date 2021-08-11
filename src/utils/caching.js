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

export const getCacheIdx = function (args, cacheKeys) {
    try {
        const cacheKeysLen = cacheKeys.length

        if (!cacheKeysLen) {
            return -1
        }

        const argsLen = args.length
        const lastArgsIdx = argsLen - 1

        for (let i = 0; i < cacheKeysLen; i++) {
            const cacheKey = cacheKeys[i]

            if (argsLen !== cacheKey.length) {
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
            args: [args, cacheKeys],
            error
        })

        return -1
    }
}
