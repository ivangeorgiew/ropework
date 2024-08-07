// so that process.env.NODE_ENV can be replaced and doesn't throw
const glProcess = globalThis.process
const process =
    glProcess instanceof Object && glProcess.env instanceof Object && typeof glProcess.env.NODE_ENV === "string"
        ? glProcess
        : { env: { NODE_ENV: "development" } }

export const isDev = process.env.NODE_ENV !== "production"

export const isTest = __TEST__

export const isWeb = typeof self === "object" && globalThis === self

export const isServer = typeof global === "object" && globalThis === global

export const FriendlyError = class extends Error {
    constructor(...args) {
        super(...args)
        this.name = this.constructor.name
    }
}

export const SpecError = class extends Error {
    constructor(...args) {
        super(...args)
        this.name = this.constructor.name
    }
}

export const browserErrorEvents = ["error", "unhandledrejection"]

export const nodeErrorEvents = ["uncaughtException", "unhandledRejection", "SIGTERM", "SIGINT", "SIGHUP"]

export const RETHROW = "__ropework_custom_string_RETHROW__"
