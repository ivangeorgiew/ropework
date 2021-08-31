import { isServer, isTest, isWeb } from "../api/constants"
import { isInt, isObj, isStr, or } from "../api/validating"
import { createArgsInfo, errorLogger, notify } from "./helpers"

const errorsCache = []

const getErrorsCacheIdx = (errorDescr, msg) => {
    try {
        if (isTest) {
            or(isStr(errorDescr), TypeError("First arg must be string"))
            or(isStr(msg), TypeError("Second arg must be string"))
        }

        const errorsCacheLen = errorsCache.length

        if (errorsCacheLen === 0) {
            return -1
        }

        for (let i = 0; i < errorsCacheLen; i++) {
            const item = errorsCache[i]

            if (
                errorDescr === item.errorDescr &&
                msg === item.msg &&
                Date.now() - item.time < 1000
            ) {
                return i
            }
        }

        return -1
    } catch (error) {
        if (isTest) {
            try {
                errorLogger(
                    "\n Issue with: getErrorsCacheIdx\n",
                    `Function arguments: ${createArgsInfo([errorDescr, msg])}\n`,
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

const manageErrorsCache = (_idx, errorDescr, msg) => {
    try {
        if (isTest) {
            or(
                isInt(_idx) && _idx >= 0,
                TypeError("First arg must be positive integer")
            )
            or(isStr(errorDescr), TypeError("Second arg must be string"))
            or(isStr(msg), TypeError("Third arg must be string"))
        }

        let idx = _idx > 5 ? 5 : _idx

        while (idx--) {
            errorsCache[idx + 1] = errorsCache[idx]
        }

        errorsCache[0] = { errorDescr, msg, time: Date.now() }
    } catch (error) {
        if (isTest) {
            try {
                errorLogger(
                    "\n Issue with: manageErrorsCache\n",
                    `Function arguments: ${createArgsInfo([
                        _idx,
                        errorDescr,
                        msg,
                    ])}\n`,
                    error,
                    "\n"
                )
            } catch (_e) {
                // nothing
            }
        }
    }
}

export const logError = props => {
    try {
        if (isTest) {
            or(isObj(props), TypeError("Must be given an object"))
        }

        const errorDescr =
            "Issue with: " +
            (typeof props.descr === "string" ? props.descr : "part of the app")

        const error =
            props.error instanceof Error ? props.error : new Error("Unknown error")

        const args = Array.isArray(props.args) ? props.args : []

        const msg = error.message

        const cacheIdx = getErrorsCacheIdx(errorDescr, msg)

        if (cacheIdx !== -1) {
            if (cacheIdx !== 0) {
                manageErrorsCache(cacheIdx, errorDescr, msg)
            }

            return
        }

        const prodInfo = {
            errorDescription: errorDescr,
            arguments: args,
            date: new Date().toUTCString(),
            error,
        }

        if (isWeb) {
            Object.assign(prodInfo, {
                url: self.location.href,
                browserInfo: self.navigator.userAgent,
                clientOS: self.navigator.platform,
            })
        } else if (isServer) {
            Object.assign(prodInfo, {
                pid: process.pid,
                filepath: process.cwd(),
                cpuArch: process.arch,
                serverOS: process.platform,
                depVersions: process.versions,
            })
        }

        notify({
            errorDescr,
            args,
            error,
            prodInfo,
        })

        errorLogger(
            `\n ${errorDescr}\n`,
            `Function arguments: ${createArgsInfo(args)}\n`,
            error,
            "\n"
        )

        manageErrorsCache(errorsCache.length, errorDescr, msg)
    } catch (error) {
        if (isTest) {
            try {
                errorLogger(
                    "\n Issue with: logError\n",
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
