import { isDev, isTest } from "../api/constants"
import { checkArr, checkFunc, checkObj, or } from "../api/validating"

const defaultLogger =
    isDev && checkObj(console) && checkFunc(console.error) ? console.error : () => {}

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
        if (isTest) {
            or(checkArr(args), TypeError("Must be passed array"))
        }

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
    } catch (error) {
        if (isTest) {
            try {
                defaultLogger(
                    "\n Issue with: createArgsInfo\n",
                    `Function arguments types: ${typeof args}\n`,
                    error,
                    "\n"
                )
            } catch (_e) {
                // nothing
            }
        }

        return "unknown args"
    }
}

export const options = Object.seal({
    errorLogger: defaultLogger,
    notify: () => {},
})

export const errorLogger = (...args) => {
    if (isDev) {
        try {
            options.errorLogger.apply(null, args)
        } catch (error) {
            try {
                defaultLogger(
                    "\n Issue with: errorLogger\n",
                    `Function arguments: ${createArgsInfo(args)}\n`,
                    error,
                    "\n"
                )
            } catch (_e) {
                // nothing
            }
        }
    }
}

export const notify = (...args) => {
    try {
        options.notify.apply(null, args)
    } catch (error) {
        try {
            errorLogger(
                "\n Issue with: notify\n",
                `Function arguments: ${createArgsInfo(args)}\n`,
                error,
                "\n"
            )
        } catch (_e) {
            // nothing
        }
    }
}

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
    } catch (_e) {
        return false
    }
}

export const getCacheIdx = (args, cacheKeys) => {
    try {
        if (isTest) {
            or(checkArr(args), TypeError("First arg must be array"))
            or(checkArr(cacheKeys), TypeError("Second arg must be array"))
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
                errorLogger(
                    "\n Issue with: getCacheIdx\n",
                    `Function arguments: ${createArgsInfo([args, cacheKeys])}\n`,
                    error,
                    "\n"
                )
            } catch (_e) {
                // nothing
            }
        }

        return -1
    }
}
