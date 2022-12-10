import { SpecError, isServer, isTest, isWeb } from "../api/constants"
import { arrDef, errorDef, strDef } from "../api/definitions"
import { createValidateFunc } from "./createValidateFunc"
import { LIB_ERROR_TEXT, innerLogError, notify } from "./innerConstants"

const logErrorValidate = createValidateFunc([
    { reqProps: { descr: strDef, args: arrDef, error: errorDef } },
])

export const logError = props => {
    if (isTest) {
        const msg = logErrorValidate([props])

        if (msg !== "") throw new SpecError(`when calling [logError]: ${msg}`)
    }

    try {
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
                descr: `[logError] ${LIB_ERROR_TEXT}`,
                args: [props],
                error,
            })
        } catch {
            // nothing
        }
    }
}
