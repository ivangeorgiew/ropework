import { logError } from './logging'

const isEqual = function (a, b) {
    try {
        return a === b || (a !== a && b !== b)
    } catch (error) {
        logError({
            descr: 'comparing 2 values for caching',
            args: Array.from(arguments),
            error
        })

        return false
    }
}

export const getCacheIdx = function (that, args, cacheKeys) {
    try {
        const cacheKeysLen = cacheKeys.length

        if (cacheKeysLen === 0) {
            return -1
        }

        const argsLen = args.length
        const lastArgsIdx = argsLen - 1

        for (let i = 0; i < cacheKeysLen; i++) {
            const cacheKey = cacheKeys[i]

            if (argsLen !== cacheKey.length || that !== cacheKey.that) {
                continue
            }

            switch (argsLen) {
                case 0: {
                    return i
                }
                case 1: {
                    if (isEqual(cacheKey[0], args[0])) {
                        return i
                    }
                    break
                }
                default: {
                    for (
                        let m = 0;
                        m < argsLen && isEqual(cacheKey[m], args[m]);
                        m++
                    ) {
                        if (m === lastArgsIdx) return i
                    }
                }
            }
        }

        return -1
    } catch (error) {
        logError({
            descr: 'searching for existing cache item',
            args: Array.from(arguments),
            error
        })

        return -1
    }
}

export const reorderCacheItem = function (cacheIdx, cacheKeys, cacheValues) {
    try {
        cacheKeys.unshift(cacheKeys[cacheIdx])
        cacheValues.unshift(cacheValues[cacheIdx])

        cacheKeys.splice(cacheIdx + 1, 1)
        cacheValues.splice(cacheIdx + 1, 1)
    } catch (error) {
        logError({
            descr: 'reordering cache item to the front',
            args: Array.from(arguments),
            error
        })
    }
}

export const storeCacheItem = function () {
    try {
        const [that, key, value, cacheKeys, cacheValues] = arguments

        key.that = that

        cacheKeys.unshift(key)
        cacheValues.unshift(value)

        if (cacheKeys.length === 5) {
            cacheKeys.pop()
            cacheValues.pop()
        }
    } catch (error) {
        logError({
            descr: 'storing key and value in cache',
            args: Array.from(arguments),
            error
        })
    }
}
