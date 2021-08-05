export const isWeb =
    typeof self === 'object' && typeof self.addEventListener === 'function'
export const isNodeJS =
    typeof global === 'object' && typeof global.process === 'object'
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
