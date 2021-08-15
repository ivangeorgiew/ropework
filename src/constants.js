export const isWeb = typeof self === 'object' && globalThis === self

export const isServer = typeof global === 'object' && globalThis === global

export const isDevelopment =
    typeof process === 'object' && typeof process.env?.NODE_ENV === 'string'
        ? process.env.NODE_ENV !== 'production'
        : true

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
