// so that process.env.NODE_ENV can be replaced and doesn't throw
const glProcess = globalThis.process
const process =
    glProcess instanceof Object &&
    glProcess.env instanceof Object &&
    typeof glProcess.env.NODE_ENV === "string"
        ? glProcess
        : { env: { NODE_ENV: "development" } }

export const isDev = process.env.NODE_ENV !== "production"

export const isTest = process.env.NODE_ENV === "testing"

export const isWeb = typeof self === "object" && globalThis === self

export const isServer = typeof global === "object" && globalThis === global

export const FriendlyError = class extends Error {
    constructor(...args) {
        super(...args)

        // V8 only
        if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(this, FriendlyError)
        }

        this.name = "FriendlyError"
    }
}

export const browserErrorEvents = ["error", "unhandledrejection"]

export const nodeErrorEvents = [
    "uncaughtException",
    "unhandledRejection",
    "SIGTERM",
    "SIGINT",
    "SIGHUP",
]
