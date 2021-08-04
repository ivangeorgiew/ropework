import { FriendlyError, isNodeJS, isWeb } from '../constants'
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

        return JSON.stringify(data, parser, 0)
    } catch (error) {
        if (isDevelopment) {
            errorLogger('\n Issue with: stringifying data\n', error, '\n')
        }

        return JSON.stringify(`[unparsed data]`)
    }
}

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

        if (isDevelopment) {
            const argsInfo = (function () {
                let acc = ''

                for (let i = 0; i < args.length; i++) {
                    const arg = args[i]
                    let parsedArg =
                        typeof arg === 'function' ? '()' : stringifyAll(arg)

                    if (parsedArg.length > 100) {
                        parsedArg = Array.isArray(arg)
                            ? '[large array]'
                            : '[large object]'
                    } else {
                        parsedArg = parsedArg.replace(
                            /"(Infinity|NaN|null|undefined|\(\)|\[\$ref\])"/g,
                            '$1'
                        )
                    }

                    acc = i === 0 ? parsedArg : `${acc} , ${parsedArg}`
                }

                return acc
            })()

            errorLogger(
                `\n ${errorDescr}\n`,
                `Function arguments: ${argsInfo}\n`,
                error,
                '\n'
            )
        }
    } catch (error) {
        errorLogger('\n Issue with: logging errors\n', error, '\n')
    }
}
