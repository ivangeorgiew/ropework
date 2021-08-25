import { FriendlyError, isServer, isWeb } from '../api/constants'
import { createArgsInfo, errorLogger, notify } from './helpers'

export const logError = props => {
    try {
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
            isFriendlyError,
            prodInfo,
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
