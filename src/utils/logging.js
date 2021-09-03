import { isServer, isTest, isWeb } from "../api/constants"
import { validateArgs } from "../api/validating"
import {
    createArgsInfo,
    errorLogger,
    logErrorDefault,
    logErrorSpec,
    notify,
} from "./helpers"
import { errorsCache, getErrorsCacheIdx, manageErrorsCache } from "./loggingHelpers"

export const logError = props => {
    try {
        if (isTest) {
            validateArgs(logErrorSpec, [props])
        }

        const { descr, args, error } = props

        const errorDescr = `Issue with: ${descr}`
        const errorMsg = error.message
        const cacheIdx = getErrorsCacheIdx(errorDescr, errorMsg)

        if (cacheIdx !== -1) {
            if (cacheIdx !== 0) {
                manageErrorsCache(cacheIdx, errorDescr, errorMsg)
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

        manageErrorsCache(errorsCache.length, errorDescr, errorMsg)
    } catch (error) {
        if (isTest) {
            try {
                logErrorDefault({ descr: "logError", args: [props], error })
            } catch (_e) {
                // nothing
            }
        }
    }
}
