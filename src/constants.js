export const isWeb =
    typeof self === 'object' && typeof self.addEventListener === 'function'

export const isNodeJS =
    typeof global === 'object' && typeof global.process === 'object'

export const isDevelopment =
    typeof process === 'object' &&
    typeof process.env === 'object' &&
    typeof process.env.NODE_ENV === 'string'
        ? process.env.NODE_ENV !== 'production'
        : false

export const FriendlyError = class extends Error {
    constructor(...args) {
        super(...args)
        this.name = 'FriendlyError'
    }
}

export const browserErrorEvents = ['error', 'unhandledrejection']

export const nodeErrorEvents = [
    'uncaughtException',
    'unhandledRejection',
    'SIGTERM',
    'SIGINT',
    'SIGHUP'
]

export const handledFuncs = new WeakSet()