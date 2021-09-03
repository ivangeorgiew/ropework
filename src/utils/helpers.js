import { isDev, isTest } from "../api/constants"
import {
    checkArr,
    checkFunc,
    checkObj,
    checkStr,
    validateArgs,
} from "../api/validating"

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

const createArgsInfoSpec = [[checkArr, "must be array"]]

export const createArgsInfo = args => {
    try {
        if (isTest) {
            validateArgs(createArgsInfoSpec, [args])
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
            defaultLogger(
                "\n Issue with: createArgsInfo\n",
                `Function arguments types: ${typeof args}\n`,
                error,
                "\n"
            )
        }

        return "unknown args"
    }
}

export const logErrorSpec = [
    {
        descr: [checkStr, "must be string"],
        args: [checkArr, "must be array"],
        error: [arg => arg instanceof Error, "must be Error"],
    },
]

export const logErrorDefault = props => {
    try {
        if (isTest) {
            validateArgs(logErrorSpec, [props])
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
            defaultLogger(
                `\n Issue with: logErrorDefault\n`,
                `Function arguments: ${createArgsInfo([props])}\n`,
                error,
                "\n"
            )
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
            logErrorDefault({ descr: "errorLogger", args, error })
        }
    }
}

export const notify = (...args) => {
    try {
        options.notify.apply(null, args)
    } catch (error) {
        logErrorDefault({ descr: "notify", args, error })
    }
}
