// constants
export const defaultDescr = 'a part of the app'
export const isBrowser = typeof window === 'object'
export const isWorker = typeof importScripts === 'function'
export const isNodeJS = typeof process?.versions?.node === 'string'
export const FriendlyError = class extends Error {
    constructor(...args) {
        super(...args)
        this.name = 'FriendlyError'
    }
}
export const browserEventNames = ['error', 'unhandledrejection']
export const nodeEventNames = [
    'uncaughtException',
    'unhandledRejection',
    'SIGTERM',
    'SIGINT',
    'SIGHUP'
]
export const handledFuncs = new WeakMap()

// Options
const defaultLogger =
    typeof console?.error === 'function' ? console.error : () => {}

let errorLoggerUnhandled = defaultLogger

let notifyUnhandled = () => {}

export let isDevelopment =
    typeof process?.env?.NODE_ENV === 'string'
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
