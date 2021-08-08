import { createArgsInfo } from './utils/helpers'

const defaultLogger =
    typeof console === 'object' && typeof console.error === 'function'
        ? console.error
        : () => {}

let errorLoggerUnhandled = defaultLogger

let notifyUnhandled = () => {}

export let isDevelopment =
    typeof process === 'object' &&
    typeof process.env === 'object' &&
    typeof process.env.NODE_ENV === 'string'
        ? process.env.NODE_ENV !== 'production'
        : false

export const errorLogger = function (...args) {
    try {
        if (isDevelopment) {
            errorLoggerUnhandled.apply(null, args)
        }
    } catch (error) {
        if (isDevelopment) {
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

        const allowedKeys = ['isDevelopment', 'errorLogger', 'notify']
        const keys = Object.keys(props)

        if (keys.length < 1 || keys.some(key => allowedKeys.indexOf(key) === -1)) {
            throw new TypeError(
                'Incorrect props, expected object in accordance with the API'
            )
        }

        if (typeof props.isDevelopment === 'boolean') {
            isDevelopment = props.isDevelopment
        }

        if (typeof props.errorLogger === 'function') {
            errorLoggerUnhandled = props.errorLogger
        }

        if (typeof props.notify === 'function') {
            notifyUnhandled = props.notify
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
