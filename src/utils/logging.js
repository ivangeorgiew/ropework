import {
    FriendlyError,
    errorLogger,
    isBrowser,
    isDevelopment,
    isNodeJS,
    isWorker,
    notify
} from '../options'

const lastError = Object.seal({
    errorDescr: '',
    argsInfo: '',
    errorMsg: '',
    time: 0
})

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
                    return '$selfRef'
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
                    : 'a part of the app'

            return descr.length > 80
                ? `Issue with: ${descr.slice(0, 77)} ...}`
                : `Issue with: ${descr}`
        })()

        const error =
            props.error instanceof Error
                ? props.error
                : new Error('Unknown error')

        const argsInfo = (function () {
            if (!Array.isArray(props.args)) {
                return ''
            }

            let [result, i] = ['', -1]

            while (props.args.length - ++i) {
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

        // prevent immedeately repeating errors
        const curTime = Date.now()

        if (
            lastError.errorDescr !== errorDescr ||
            lastError.argsInfo !== argsInfo ||
            lastError.errorMsg !== error.message ||
            curTime - lastError.time > 1000
        ) {
            errorLogger(
                `\n ${errorDescr}\n`,
                `Function arguments: ${argsInfo}\n`,
                error,
                '\n'
            )

            notify({
                isFriendlyError,
                isDevelopment,
                prodInfo,
                error,
                errorDescr
            })
        }

        Object.assign(lastError, {
            errorDescr,
            argsInfo,
            errorMsg: error.message,
            time: curTime
        })
    } catch (error) {
        errorLogger('\n Issue with: logging errors\n', error, '\n')
    }
}
