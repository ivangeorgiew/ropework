import { FriendlyError, isBrowser, isNodeJS, isWorker } from '../constants'
import { errorLogger, isDevelopment, notify } from '../options'

const stringifyAll = function (data) {
    try {
        const seen = new WeakSet()
        const parser = function (_key, val) {
            if ([Infinity, NaN, null, undefined].includes(val)) {
                return String(val)
            }

            if (typeof val === 'bigint') {
                return Number(val)
            }

            if (typeof val === 'object' || typeof val === 'function') {
                if (seen.has(val)) {
                    return '[$ref]'
                }

                seen.add(val)

                if (typeof val === 'function') {
                    return '()'
                }
            }

            return val
        }

        return JSON.stringify(data, parser)
    } catch (error) {
        if (isDevelopment) {
            errorLogger('\n Issue with: stringifying data\n', error, '\n')
        }

        return JSON.stringify(`[unparsed ${typeof data}]`)
    }
}

export const logError = function (props) {
    try {
        props = Object.assign({}, props)

        const errorDescr = (function () {
            const descr =
                typeof props.descr === 'string'
                    ? props.descr
                    : 'part of the app'

            return `Issue with: ${descr}`
        })()

        const error =
            props.error instanceof Error
                ? props.error
                : new Error('Unknown error')

        const argsInfo = (function () {
            let result = ''

            if (!Array.isArray(props.args)) {
                return result
            }

            for (let i = 0; i < props.args.length; i++) {
                let arg = props.args[i]

                if (typeof arg === 'function') {
                    arg = '()'
                } else {
                    arg = stringifyAll(arg).replace(/\n|\t|\r/g, '')
                }

                result += i === 0 ? arg : ` , ${arg}`
            }

            return result.length > 80 ? result.slice(0, 77) + '...' : result
        })()

        const isFriendlyError = error instanceof FriendlyError

        const prodInfo = {
            errorDescription: errorDescr,
            arguments: argsInfo,
            date: new Date().toUTCString(),
            error
        }

        if (isBrowser || isWorker) {
            Object.assign(prodInfo, {
                localUrl: self.location.href,
                browserInfo: self.navigator.userAgent,
                osType: self.navigator.platform
            })
        }

        if (isNodeJS) {
            Object.assign(prodInfo, {
                localUrl: process.cwd(),
                cpuArch: process.arch,
                osType: process.platform,
                depVersions: process.versions
            })
        }

        if (isDevelopment) {
            errorLogger(
                `\n ${errorDescr}\n`,
                `Function arguments: ${argsInfo}\n`,
                error,
                '\n'
            )
        }

        notify({
            errorDescr,
            argsInfo,
            error,
            isFriendlyError,
            prodInfo
        })
    } catch (error) {
        errorLogger('\n Issue with: logging errors\n', error, '\n')
    }
}
