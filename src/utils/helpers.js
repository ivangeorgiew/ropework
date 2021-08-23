import { isDev } from '../api/constants'

const stringifyAll = data => {
    try {
        const seen = new WeakSet()
        const parser = (_key, val) => {
            if ([Infinity, NaN, null, undefined].includes(val)) {
                return `[${String(val)}]`
            } else if (typeof val === 'bigint') {
                return Number(val)
            } else if (typeof val === 'object' || typeof val === 'function') {
                if (seen.has(val)) {
                    return '[$ref]'
                } else {
                    seen.add(val)

                    return typeof val === 'function' ? '[f(x)]' : val
                }
            } else {
                return val
            }
        }

        return JSON.stringify(data, parser, 0)
    } catch (error) {
        return JSON.stringify(`[unparsed data]`)
    }
}

export const createArgsInfo = args => {
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

const defaultLogger =
    typeof console === 'object' && typeof console.error === 'function'
        ? console.error
        : () => {}

let errorLoggerUnhandled = defaultLogger

let notifyUnhandled = () => {}

export const errorLogger = (...args) => {
    if (isDev) {
        try {
            errorLoggerUnhandled.apply(null, args)
        } catch (error) {
            const argsInfo = createArgsInfo(args)

            defaultLogger(
                '\n Issue with: parameter errorLogger\n',
                `Function arguments: ${argsInfo}\n`,
                error,
                '\n'
            )
        }
    }
}

export const changeErrorLogger = newProp => {
    errorLoggerUnhandled = newProp
}

export const notify = (...args) => {
    try {
        notifyUnhandled.apply(null, args)
    } catch (error) {
        const argsInfo = createArgsInfo(args)

        errorLogger(
            '\n Issue with: parameter notify\n',
            `Function arguments: ${argsInfo}\n`,
            error,
            '\n'
        )
    }
}

export const changeNotify = newProp => {
    notifyUnhandled = newProp
}

const toKeys = a => [
    ...Object.getOwnPropertyNames(a),
    ...Object.getOwnPropertySymbols(a)
]

const isSVZ = (a, b) => a === b || (a !== a && b !== b)

const isEqual = (a, b) => {
    try {
        let ctr

        if (a === b) {
            return true
        } else if (a && b && (ctr = a.constructor) === b.constructor) {
            if (ctr !== Object && ctr !== Array) {
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

export const getCacheIdx = (args, cacheKeys) => {
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

export const handledFuncs = new WeakSet()
