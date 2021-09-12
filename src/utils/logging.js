import { isServer, isWeb } from "../api/constants"
import { arrDef, createDef, errorDef, strDef } from "../api/definitions"
import { createValidateFunc } from "./createValidateFunc"
import { innerLogError, isTest } from "./generics"
import {
    errorsCache,
    getErrorsCacheIdx,
    manageErrorsCache,
    notify,
} from "./loggingHelpers"

const logErrorPropsDef = /*#__PURE__*/ createDef({
    strictProps: {
        descr: strDef,
        args: arrDef,
        error: errorDef,
    },
})
const logErrorSpec = [logErrorPropsDef]
const logErrorValidate = createValidateFunc(logErrorSpec)

export const logError = props => {
    try {
        if (isTest) {
            logErrorValidate(props)
        }

        const { descr, args, error } = props
        const errorMsg = error.message
        const cacheIdx = getErrorsCacheIdx(descr, errorMsg)

        if (cacheIdx !== -1) {
            if (cacheIdx !== 0) {
                manageErrorsCache(cacheIdx, descr, errorMsg)
            }

            return
        }

        const notifyProps = {
            descr,
            args,
            error,
            date: new Date().toUTCString(),
        }

        if (isWeb) {
            Object.assign(notifyProps, {
                url: self.location.href,
                browserInfo: self.navigator.userAgent,
                clientOS: self.navigator.platform,
            })
        } else if (isServer) {
            Object.assign(notifyProps, {
                pid: process.pid,
                filepath: process.cwd(),
                cpuArch: process.arch,
                serverOS: process.platform,
                depVersions: process.versions,
            })
        }

        notify(notifyProps)

        innerLogError({ descr, args, error })

        manageErrorsCache(errorsCache.length, descr, errorMsg)
    } catch (error) {
        if (isTest) {
            try {
                innerLogError({ descr: "logError", args: [props], error })
            } catch {
                // nothing
            }
        }
    }
}
