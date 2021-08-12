const isEqual = (a, b) => a === b || (a !== a && b !== b)

const stringifyAll = function (data) {
    try {
        const seen = new WeakSet()
        const parser = function (_key, val) {
            if ([Infinity, NaN, null, undefined].includes(val)) {
                return `[${String(val)}]`
            }

            if (typeof val === 'bigint') {
                return Number(val)
            }

            if (typeof val === 'object' || typeof val === 'function') {
                if (seen.has(val)) {
                    return '[$ref]'
                }

                seen.add(val)

                if (typeof val === 'function') {
                    return '[f()]'
                }
            }

            return val
        }

        return JSON.stringify(data, parser, 0)
    } catch (error) {
        return JSON.stringify(`[unparsed data]`)
    }
}

export const createArgsInfo = function (args) {
    try {
        let acc = ''

        for (let i = 0; i < args.length; i++) {
            const arg = args[i]
            let parsedArg = typeof arg === 'function' ? 'f()' : stringifyAll(arg)

            if (parsedArg.length > 100) {
                parsedArg = Array.isArray(arg) ? '[large array]' : '[large object]'
            } else {
                parsedArg = parsedArg.replace(
                    /"\[(Infinity|NaN|null|undefined|f\(\)|\$ref)\]"/g,
                    '$1'
                )
            }

            acc = i === 0 ? parsedArg : `${acc} , ${parsedArg}`
        }

        return acc
    } catch (error) {
        return ''
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
        return -1
    }
}
