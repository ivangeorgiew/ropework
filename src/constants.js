export const isWeb = typeof self === 'object'
export const isNodeJS = typeof process?.versions?.node === 'string'
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
