const stringifyAll = function (data) {
    try {
        const seen = new WeakSet()
        const parser = function (_key, val) {
            switch (true) {
                case [Infinity, NaN, null, undefined].includes(val):
                    return `[${String(val)}]`
                case typeof val === 'bigint':
                    return Number(val)
                case typeof val === 'object' || typeof val === 'function':
                    if (seen.has(val)) return '[$ref]'

                    seen.add(val)

                    return typeof val === 'function' ? '[f(x)]' : val
                default:
                    return val
            }
        }

        return JSON.stringify(data, parser, 0)
    } catch (error) {
        return JSON.stringify(`[unparsed data]`)
    }
}

export const createArgsInfo = function (args) {
    try {
        let acc

        for (let i = 0; i < args.length; i++) {
            const arg = args[i]
            let parsedArg = typeof arg === 'function' ? 'f(x)' : stringifyAll(arg)

            if (parsedArg.length > 100) {
                parsedArg = Array.isArray(arg) ? '[large array]' : '[large object]'
            } else {
                parsedArg = parsedArg.replace(
                    /"\[(Infinity|NaN|null|undefined|f\(x\)|\$ref)\]"/g,
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

const toKeys = Object.keys

const isSVZ = (a, b) => a === b || (a !== a && b !== b)

const isEqual = function (a, b) {
    try {
        if (a === b) {
            return true
        } else if (a && b && a.constructor === b.constructor) {
            if (typeof a !== 'object') {
                return false
            } else {
                const objKeys = toKeys(a)
                const objKeysLen = objKeys.length

                if (objKeysLen !== toKeys(b).length) {
                    return false
                } else if (objKeysLen === 0) {
                    return true
                } else if (objKeysLen === 1) {
                    return isSVZ(a[objKeys[0]], b[objKeys[0]])
                } else {
                    for (
                        let m = 0;
                        m < objKeysLen && isSVZ(a[objKeys[m]], b[objKeys[m]]);
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
        return false
    }
}

export const getCacheIdx = function (args, cacheKeys) {
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
                if (isEqual(key[0], args[0])) return i
            } else {
                for (let m = 0; m < argsLen && isEqual(key[m], args[m]); m++) {
                    if (m === argsLen - 1) return i
                }
            }
        }

        return -1
    } catch (error) {
        return -1
    }
}
