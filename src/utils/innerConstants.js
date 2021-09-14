import { isDev } from "../api/constants"

export const isTest = __TEST__

const defaultLogger =
    isDev && console instanceof Object && typeof console.error === "function"
        ? console.error
        : () => {}

export const options = Object.seal({
    errorLogger: defaultLogger,
    notify: () => {},
})

const stringifyAll = data => {
    try {
        const seen = new WeakSet()
        const parser = (_key, val) => {
            if ([Infinity, NaN, null, undefined].includes(val)) {
                return `#${String(val)}#`
            } else if (typeof val === "bigint") {
                return Number(val)
            } else if (typeof val === "object" || typeof val === "function") {
                if (seen.has(val)) {
                    return "#$ref#"
                } else {
                    seen.add(val)

                    return typeof val === "function" ? "#f(x)#" : val
                }
            } else {
                return val
            }
        }

        return JSON.stringify(data, parser, 0)
    } catch (error) {
        if (isTest) {
            try {
                defaultLogger(
                    "\n Issue with: stringifyAll\n",
                    `Function arguments: ${data}\n`,
                    error,
                    "\n"
                )
            } catch {
                // nothing
            }
        }

        return JSON.stringify("[unknown]")
    }
}

export const createArgsInfo = args => {
    try {
        if (isTest) {
            if (!Array.isArray(args)) {
                throw TypeError("arguments[0] - must be array")
            }
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
                          /"#(Infinity|NaN|null|undefined|f\(x\)|\$ref)#"/g,
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
                    `Function arguments: ${args}\n`,
                    error,
                    "\n"
                )
            } catch {
                // nothing
            }
        }

        return "unknown args"
    }
}

const errorLogger = (...args) => {
    if (isDev) {
        try {
            options.errorLogger(...args)
        } catch (error) {
            try {
                defaultLogger(
                    `\n Issue with: errorLogger\n`,
                    `Function arguments: ${createArgsInfo(args)}\n`,
                    error,
                    "\n"
                )
            } catch {
                // nothing
            }
        }
    }
}

export const innerLogError = props => {
    try {
        if (isTest) {
            if (!(props instanceof Object)) {
                throw TypeError("arguments[0] - must be object")
            }

            if (typeof props.descr !== "string") {
                throw TypeError("arguments[0][descr] - must be string")
            }

            if (!Array.isArray(props.args)) {
                throw TypeError("arguments[0][args] - must be array")
            }

            if (!(props.error instanceof Error)) {
                throw TypeError("arguments[0][error] - must be error")
            }
        }

        const { descr, args, error } = props

        errorLogger(
            `\n Issue with: ${descr}\n`,
            `Function arguments: ${createArgsInfo(args)}\n`,
            error,
            "\n"
        )
    } catch (error) {
        if (isTest) {
            try {
                errorLogger(
                    `\n Issue with: innerLogError\n`,
                    `Function arguments: ${createArgsInfo([props])}\n`,
                    error,
                    "\n"
                )
            } catch {
                // nothing
            }
        }
    }
}

export const checkObjType = a => {
    const t = typeof a

    return a !== null && (t === "object" || t === "function")
}

export const checkObj = a => {
    const c = a.constructor

    return checkObjType(a) && (c === Object || c === undefined)
}

export const optsKeysGetMsg = (a, keys) => {
    try {
        if (isTest) {
            if (!Array.isArray(keys)) {
                throw TypeError("arguments[1] - must be array")
            }
        }

        if (!checkObj(a)) {
            return "must be object"
        }

        const aKeys = Object.keys(a)
        let hasValidKeys = false

        for (let i = 0; i < aKeys.length; i++) {
            const aKey = aKeys[i]

            if (keys.indexOf(aKey) === -1) {
                return `has invalid property name: ${aKey}`
            } else if (!hasValidKeys) {
                hasValidKeys = true
            }
        }

        if (!hasValidKeys) {
            return `should contain at least one of: ${keys.join(", ")}`
        }

        return ""
    } catch (error) {
        if (isTest) {
            try {
                innerLogError({
                    descr: "optsKeysGetMsg",
                    args: [a, keys],
                    error,
                })
            } catch {
                // nothing
            }
        }

        return ""
    }
}
