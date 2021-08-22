const glProcess = globalThis.process
const process =
    typeof glProcess instanceof Object &&
    typeof glProcess.env instanceof Object &&
    typeof glProcess.env.NODE_ENV === 'string'
        ? glProcess
        : { env: { NODE_ENV: 'production' } }

// so that process.env.NODE_ENV can be replaced AND doesn't throw
export const isDev = process.env.NODE_ENV !== 'production'

export const isWeb = typeof self === 'object' && globalThis === self

export const isServer = typeof global === 'object' && globalThis === global

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
