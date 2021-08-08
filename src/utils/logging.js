import { FriendlyError, isNodeJS, isWeb } from '../constants'
import { errorLogger, notify } from '../options'
import { createArgsInfo } from './loggingHelpers'

export const logError = function (props) {
    try {
        props = Object.assign({}, props)

        const errorDescr =
            'Issue with: ' +
            (typeof props.descr === 'string' ? props.descr : 'part of the app')

        const error =
            props.error instanceof Error ? props.error : new Error('Unknown error')

        const args = Array.isArray(props.args) ? props.args : []

        const isFriendlyError = error instanceof FriendlyError

        const prodInfo = {
            errorDescription: errorDescr,
            arguments: args,
            date: new Date().toUTCString(),
            error
        }

        if (isWeb) {
            Object.assign(prodInfo, {
                localUrl: self.location.href,
                browserInfo: self.navigator.userAgent,
                osType: self.navigator.platform
            })
        }

        if (isNodeJS) {
            Object.assign(prodInfo, {
                pid: process.pid,
                localUrl: process.cwd(),
                cpuArch: process.arch,
                osType: process.platform,
                depVersions: process.versions
            })
        }

        notify({
            errorDescr,
            args,
            error,
            isFriendlyError,
            prodInfo
        })

        const argsInfo = createArgsInfo(args)

        errorLogger(
            `\n ${errorDescr}\n`,
            `Function arguments: ${argsInfo}\n`,
            error,
            '\n'
        )
    } catch (error) {
        const argsInfo = createArgsInfo([props])

        errorLogger(
            '\n Issue with: logging errors\n',
            `Function arguments: ${argsInfo}\n`,
            error,
            '\n'
        )
    }
}
