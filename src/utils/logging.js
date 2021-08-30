import { isServer, isWeb } from "../api/constants"
import { createArgsInfo, errorLogger, notify } from "./helpers"

const errorsCache = []

const getErrorsCacheIdx = (errorDescr, msg) => {
    try {
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
    } catch (_e) {
        return -1
    }
}

const manageErrorsCache = (_idx, errorDescr, msg) => {
    try {
        let idx = _idx > 5 ? 5 : _idx

        while (idx--) {
            errorsCache[idx + 1] = errorsCache[idx]
        }

        errorsCache[0] = { errorDescr, msg, time: Date.now() }
    } catch (_e) {
        // nothing
    }
}

export const logError = props => {
    try {
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

        const argsInfo = createArgsInfo(args)

        errorLogger(
            `\n ${errorDescr}\n`,
            `Function arguments: ${argsInfo}\n`,
            error,
            "\n"
        )

        manageErrorsCache(errorsCache.length, errorDescr, msg)
    } catch (error) {
        try {
            const argsInfo = createArgsInfo([props])

            errorLogger(
                "\n Issue with: logging errors\n",
                `Function arguments: ${argsInfo}\n`,
                error,
                "\n"
            )
        } catch (_e) {
            // nothing
        }
    }
}
