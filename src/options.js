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
            errorLoggerUnhandled.apply(this, args)
        }
    } catch (error) {
        if (isDevelopment) {
            defaultLogger('\n Issue with: parameter errorLogger\n', error, '\n')
        }
    }
}

export const notify = function (...args) {
    try {
        notifyUnhandled.apply(this, args)
    } catch (error) {
        errorLogger('\n Issue with: parameter notify\n', error, '\n')
    }
}

export const changeOptions = function (props) {
    try {
        props = Object.assign({}, props)

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
        errorLogger('\n Issue with: changing options\n', error, '\n')
    }
}
