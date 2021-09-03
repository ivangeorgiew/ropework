import { isServer, isTest, isWeb } from "../api/constants"
import { checkObj, validateArgs } from "../api/validating"
import { createArgsInfo, errorLogger, logErrorDefault, notify } from "./helpers"
import { errorsCache, getErrorsCacheIdx, manageErrorsCache } from "./loggingHelpers"

const logErrorSpec = [[checkObj, "Must be given an object"]]

export const logError = props => {
    try {
        if (isTest) {
            validateArgs(logErrorSpec, [props])
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
            logErrorDefault({ descr: "logError", args: [props], error })
        }
    }
}
