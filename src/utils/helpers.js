import { isDev } from "../api/constants"

const stringifyAll = data => {
    try {
        const seen = new WeakSet()
        const parser = (_key, val) => {
            if ([Infinity, NaN, null, undefined].includes(val)) {
                return `[${String(val)}]`
            } else if (typeof val === "bigint") {
                return Number(val)
            } else if (typeof val === "object" || typeof val === "function") {
                if (seen.has(val)) {
                    return "[$ref]"
                } else {
                    seen.add(val)

                    return typeof val === "function" ? "[f(x)]" : val
                }
            } else {
                return val
            }
        }

        return JSON.stringify(data, parser, 0)
    } catch (_e) {
        return JSON.stringify("[unknown]")
    }
}

export const createArgsInfo = args => {
    try {
        const argsInfo = args.reduce((acc, arg, i) => {
            const stringified =
                typeof arg === "function" ? "f(x)" : stringifyAll(arg)

            const parsedArg =
                stringified.length > 100
                    ? Array.isArray(arg)
                        ? "[large array]"
                        : `[large ${typeof arg}]`
                    : stringified.replace(
                          /"\[(Infinity|NaN|null|undefined|f\(x\)|\$ref)\]"/g,
                          "$1"
                      )

            return i === 0 ? parsedArg : `${acc} , ${parsedArg}`
        }, "")

        return argsInfo === "" ? "no args" : argsInfo
    } catch (_e) {
        return "unknown args"
    }
}

const defaultLogger =
    typeof console === "object" && typeof console.error === "function"
        ? console.error
        : () => {}

let errorLoggerUnhandled = defaultLogger

export const errorLogger = (...args) => {
    if (isDev) {
        try {
            errorLoggerUnhandled.apply(null, args)
        } catch (error) {
            try {
                const argsInfo = createArgsInfo(args)

                defaultLogger(
                    "\n Issue with: parameter errorLogger\n",
                    `Function arguments: ${argsInfo}\n`,
                    error,
                    "\n"
                )
            } catch (_e) {
                // nothing
            }
        }
    }
}

export const changeErrorLogger = newProp => {
    try {
        errorLoggerUnhandled = newProp
    } catch (_e) {
        // nothing
    }
}

let notifyUnhandled = () => {}

export const notify = (...args) => {
    try {
        notifyUnhandled.apply(null, args)
    } catch (error) {
        try {
            const argsInfo = createArgsInfo(args)

            errorLogger(
                "\n Issue with: parameter notify\n",
                `Function arguments: ${argsInfo}\n`,
                error,
                "\n"
            )
        } catch (_e) {
            // nothing
        }
    }
}

export const changeNotify = newProp => {
    try {
        notifyUnhandled = newProp
    } catch (_e) {
        // nothing
    }
}

export const handledFuncs = new WeakSet()

const toKeys = a => [
    ...Object.getOwnPropertyNames(a),
    ...Object.getOwnPropertySymbols(a),
]

const isSVZ = (a, b) => a === b || (a !== a && b !== b)

const isEqual = (a, b) => {
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
    } catch (_e) {
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
    } catch (_e) {
        return -1
    }
}
