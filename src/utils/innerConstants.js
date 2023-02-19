import { SpecError, isDev, isTest } from "../api/constants"

export const LIB_ERROR_TEXT = "from library ropework"

const defaultLogger =
    isDev && console instanceof Object && typeof console.error === "function"
        ? console.error
        : () => {}

export const options = Object.seal({
    errorLogger: defaultLogger,
    notify: () => {},
    shouldValidate: isDev,
})

const stringifyAny = (data, shouldTrim) => {
    if (isTest) {
        if (typeof shouldTrim !== "boolean") {
            throw new SpecError(
                "While calling [stringifyAny]:\n  args[1] - must be boolean"
            )
        }
    }

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

        const stringified =
            typeof data === "function" ? "f(x)" : JSON.stringify(data, parser, 0)

        return shouldTrim && stringified.length > 1000
            ? Array.isArray(data)
                ? "[large array]"
                : `[large ${typeof data}]`
            : stringified.replace(
                  /"#(Infinity|NaN|null|undefined|f\(x\)|\$ref)#"/g,
                  "$1"
              )
    } catch (error) {
        try {
            defaultLogger(
                `\n Issue at: [stringifyAny] ${LIB_ERROR_TEXT}\n`,
                `Function args: ${data}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }

        return "[unknown]"
    }
}

const createArgsInfo = args => {
    if (isTest) {
        if (!Array.isArray(args)) {
            throw new SpecError(
                "While calling [createArgsInfo]:\n  args[0] - must be array"
            )
        }
    }

    try {
        const argsInfo = args.reduce((acc, arg, i) => {
            const parsedArg = stringifyAny(arg, true)

            return i === 0 ? parsedArg : `${acc} , ${parsedArg}`
        }, "")

        return argsInfo === "" ? "[no args]" : argsInfo
    } catch (error) {
        try {
            defaultLogger(
                `\n Issue at: [createArgsInfo] ${LIB_ERROR_TEXT}\n`,
                `Function args: ${args}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }

        return "[unknown args]"
    }
}

const errorLogger = (...args) => {
    if (isDev) {
        try {
            options.errorLogger(...args)
        } catch (error) {
            try {
                defaultLogger(
                    `\n Issue at: [errorLogger] ${LIB_ERROR_TEXT}\n`,
                    `Function args: ${createArgsInfo(args)}\n`,
                    error,
                    "\n"
                )
            } catch {
                // nothing
            }
        }
    }
}

export const notify = (...args) => {
    try {
        options.notify(...args)
    } catch (error) {
        try {
            errorLogger(
                `\n Issue at: [notify] ${LIB_ERROR_TEXT}\n`,
                `Function args: ${createArgsInfo(args)}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }
    }
}

const errorsCache = []

export const getErrorsCacheIdx = (descr, msg) => {
    if (isTest) {
        if (typeof descr !== "string") {
            throw new SpecError(
                "While calling [getErrorsCacheIdx]:\n  args[0] - must be string"
            )
        }

        if (typeof msg !== "string") {
            throw new SpecError(
                "While calling [getErrorsCacheIdx]:\n  args[1] - must be string"
            )
        }
    }

    try {
        const errorsCacheLen = errorsCache.length

        if (errorsCacheLen === 0) {
            return -1
        }

        for (let i = 0; i < errorsCacheLen; i++) {
            const item = errorsCache[i]

            if (descr === item.descr && msg === item.msg) {
                if (Date.now() - item.time < 1000) {
                    return i
                } else {
                    errorsCache.splice(i, 1)

                    return -1
                }
            }
        }

        return -1
    } catch (error) {
        try {
            errorLogger(
                `\n Issue at: [getErrorsCacheIdx] ${LIB_ERROR_TEXT}\n`,
                `Function args: ${createArgsInfo([descr, msg])}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }

        return -1
    }
}

export const manageErrorsCache = (idx, descr, msg) => {
    if (isTest) {
        if (!Number.isInteger(idx) || !Number.isFinite(idx) || idx < 0) {
            throw new SpecError(
                "While calling [manageErrorsCache]:\n  args[0] - must be positive integer or 0"
            )
        }

        if (typeof descr !== "string") {
            throw new SpecError(
                "While calling [manageErrorsCache]:\n  args[1] - must be string"
            )
        }

        if (typeof msg !== "string") {
            throw new SpecError(
                "While calling [manageErrorsCache]:\n  args[2] - must be string"
            )
        }
    }

    try {
        for (let i = idx > 4 ? 4 : idx; i--; ) {
            errorsCache[i + 1] = errorsCache[i]
        }

        errorsCache[0] = { descr, msg, time: Date.now() }
    } catch (error) {
        try {
            errorLogger(
                `\n Issue at: [manageErrorsCache] ${LIB_ERROR_TEXT}\n`,
                `Function args: ${createArgsInfo([idx, descr, msg])}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }
    }
}

export const innerLogError = props => {
    if (isTest) {
        if (!(props instanceof Object)) {
            throw new SpecError(
                "While calling [innerLogError]:\n  args[0] - must be object"
            )
        }

        if (typeof props.descr !== "string") {
            throw new SpecError(
                "While calling [innerLogError]:\n  args[0][descr] - must be string"
            )
        }

        if (!Array.isArray(props.args)) {
            throw new SpecError(
                "While calling [innerLogError]:\n  args[0][args] - must be array"
            )
        }

        if (!(props.error instanceof Error)) {
            throw new SpecError(
                "While calling [innerLogError]:\n  args[0][error] - must be error"
            )
        }
    }

    try {
        const { descr, args, error } = props
        const errorMsg = error.message
        const cacheIdx = getErrorsCacheIdx(descr, errorMsg)

        if (cacheIdx !== -1) {
            if (cacheIdx !== 0) {
                manageErrorsCache(cacheIdx, descr, errorMsg)
            }

            return
        }

        errorLogger(
            `\n Issue at: [${descr}]\n`,
            `Function args: ${createArgsInfo(args)}\n`,
            error,
            "\n"
        )

        manageErrorsCache(errorsCache.length, descr, errorMsg)
    } catch (error) {
        try {
            errorLogger(
                `\n Issue at: [innerLogError] ${LIB_ERROR_TEXT}\n`,
                `Function args: ${createArgsInfo([props])}\n`,
                error,
                "\n"
            )
        } catch {
            // nothing
        }
    }
}

export const checkObjType = a => {
    try {
        const t = typeof a

        return a !== null && (t === "object" || t === "function")
    } catch (error) {
        try {
            innerLogError({
                descr: `[checkObjType] ${LIB_ERROR_TEXT}`,
                args: [a],
                error,
            })
        } catch {
            // nothing
        }

        throw error
    }
}

export const checkObj = a => {
    try {
        const c = a.constructor

        return checkObjType(a) && (c === Object || c === undefined)
    } catch (error) {
        try {
            innerLogError({
                descr: `[checkObj] ${LIB_ERROR_TEXT}`,
                args: [a],
                error,
            })
        } catch {
            // nothing
        }

        throw error
    }
}
