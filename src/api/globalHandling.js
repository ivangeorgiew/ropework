import { createFunc } from "../utils/createFunc"
import { logError } from "../utils/logging"
import { browserErrorEvents, isServer, isWeb, nodeErrorEvents } from "./constants"
import { checkBool, validateArgs } from "./validating"

const uncaughtErrorListener = createFunc(
    "listening for uncaught errors",
    () => {},
    eventOrError => {
        const descr = "unhandled error"
        const unknownMsg = "Unknown error"

        if (isWeb) {
            const error = !(eventOrError instanceof Event)
                ? Error(unknownMsg)
                : eventOrError.reason instanceof Error
                ? eventOrError.reason
                : eventOrError.error instanceof Error
                ? eventOrError.error
                : Error(unknownMsg)

            if (eventOrError instanceof Event) {
                eventOrError.stopImmediatePropagation()
                eventOrError.preventDefault()
            }

            logError({ descr, args: [], error })
        } else if (isServer) {
            const exitCode = eventOrError instanceof Error ? 1 : 0

            if (eventOrError instanceof Error) {
                logError({ descr, args: [], error: eventOrError })
            }

            setTimeout(() => {
                process.exit(exitCode)
            }, 500).unref()
        }
    }
)

const globalHandleErrorsSpec = [[checkBool, "must be boolean"]]

export const globalHandleErrors = createFunc(
    "handling listeners for uncaught errors",
    () => {},
    shouldAdd => {
        validateArgs(globalHandleErrorsSpec, [shouldAdd])

        if (isWeb) {
            browserErrorEvents.forEach(event => {
                self.removeEventListener(event, uncaughtErrorListener, true)

                if (shouldAdd) {
                    self.addEventListener(event, uncaughtErrorListener, true)
                }
            })
        } else if (isServer) {
            nodeErrorEvents.forEach(event => {
                process.removeListener(event, uncaughtErrorListener)

                if (shouldAdd) {
                    process.on(event, uncaughtErrorListener)
                }
            })
        }
    }
)
