import { isDev, isTest } from "../api/constants"
import { arrDef, checkObj, createValidator, strDef } from "../api/validating"

const defaultLogger =
    isDev && checkObj(console) && typeof console.error === "function"
        ? console.error
        : () => {}

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
    } catch (error) {
        if (isTest) {
            try {
                defaultLogger(
                    "\n Issue with: stringifyAll\n",
                    `Function arguments types: ${typeof data}\n`,
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

const createArgsInfoSpec = [arrDef]
const createArgsInfoValidate = createValidator(createArgsInfoSpec)

export const createArgsInfo = args => {
    try {
        if (isTest) {
            createArgsInfoValidate(args)
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
            } catch {
                // nothing
            }
        }

        return "unknown args"
    }
}

export const logErrorSpec = [
    {
        descr: strDef,
        args: arrDef,
        error: [arg => arg instanceof Error, "must be Error"],
    },
]
export const logErrorValidate = createValidator(logErrorSpec)

export const logErrorDefault = props => {
    try {
        if (isTest) {
            logErrorValidate(props)
        }

        const { descr, args, error } = props

        defaultLogger(
            `\n Issue with: ${descr}\n`,
            `Function arguments: ${createArgsInfo(args)}\n`,
            error,
            "\n"
        )
    } catch (error) {
        if (isTest) {
            try {
                defaultLogger(
                    `\n Issue with: logErrorDefault\n`,
                    `Function arguments: ${createArgsInfo([props])}\n`,
                    error,
                    "\n"
                )
            } catch (_e) {
                // nothing
            }
        }
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
                logErrorDefault({ descr: "errorLogger", args, error })
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
            logErrorDefault({ descr: "notify", args, error })
        } catch (_e) {
            // nothing
        }
    }
}
