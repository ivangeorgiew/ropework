import { isDevelopment } from './constants'
import { createArgsInfo } from './utils/helpers'

const defaultLogger =
    typeof console === 'object' && typeof console.error === 'function'
        ? console.error
        : () => {}

let errorLoggerUnhandled = defaultLogger

let notifyUnhandled = () => {}

export const errorLogger = function (...args) {
    if (isDevelopment) {
        try {
            errorLoggerUnhandled.apply(null, args)
        } catch (error) {
            const argsInfo = createArgsInfo(args)

            defaultLogger(
                '\n Issue with: parameter errorLogger\n',
                `Function arguments: ${argsInfo}\n`,
                error,
                '\n'
            )
        }
    }
}

export const notify = function (...args) {
    try {
        notifyUnhandled.apply(null, args)
    } catch (error) {
        const argsInfo = createArgsInfo(args)

        errorLogger(
            '\n Issue with: parameter notify\n',
            `Function arguments: ${argsInfo}\n`,
            error,
            '\n'
        )
    }
}

export const changeOptions = function (props) {
    try {
        props = Object.assign({}, props)

        let hasMadeChanges = false

        if (typeof props.errorLogger === 'function') {
            errorLoggerUnhandled = props.errorLogger
            hasMadeChanges = true
        }

        if (typeof props.notify === 'function') {
            notifyUnhandled = props.notify
            hasMadeChanges = true
        }

        if (!hasMadeChanges) {
            throw new TypeError('Pass correct options object please')
        }
    } catch (error) {
        const argsInfo = createArgsInfo([props])

        errorLogger(
            '\n Issue with: changing options\n',
            `Function arguments: ${argsInfo}\n`,
            error,
            '\n'
        )
    }
}
