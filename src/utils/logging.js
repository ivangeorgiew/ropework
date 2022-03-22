import { isServer, isTest, isWeb } from "../api/constants"
import { arrDef, createDef, errorDef, strDef } from "../api/definitions"
import { createValidateFunc } from "./createValidateFunc"
import { innerLogError, notify } from "./innerConstants"

const logErrorValidate = createValidateFunc([
    createDef({
        strictProps: {
            descr: strDef,
            args: arrDef,
            error: errorDef,
        },
    }),
])

export const logError = props => {
    try {
        if (isTest) {
            logErrorValidate([props])
        }

        const { descr, args, error } = props

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
    } catch (error) {
        try {
            innerLogError({
                descr: "[logError] from the library",
                args: [props],
                error,
            })
        } catch {
            // nothing
        }
    }
}
