import { browserErrorEvents, isServer, isWeb, nodeErrorEvents } from './constants'
import { tieUpEff } from './tieUp'
import { logError } from './utils/logging'

const webListener = tieUpEff(
    'listening for web errors',
    () => {},
    eventOrError => {
        let error

        if (eventOrError instanceof Event) {
            eventOrError.stopImmediatePropagation()
            eventOrError.preventDefault()

            error =
                eventOrError.reason instanceof Error
                    ? eventOrError.reason
                    : eventOrError.error instanceof Error
                    ? eventOrError.error
                    : undefined
        }

        logError({ descr: 'unhandled error', error })
    }
)

const serverListener = tieUpEff(
    'listening for server errors',
    () => {},
    eventOrError => {
        let exitCode = 0

        if (eventOrError instanceof Error) {
            exitCode = 1

            logError({ descr: 'unhandled error', error: eventOrError })
        }

        global
            .setTimeout(() => {
                process.exit(exitCode)
            }, 500)
            .unref()
    }
)

const uncaughtErrorListener = tieUpEff(
    'listening for uncaught errors',
    () => {},
    eventOrError => {
        if (isWeb) {
            webListener(eventOrError)
        }

        if (isServer) {
            serverListener(eventOrError)
        }
    }
)

const handleWebErrors = tieUpEff(
    'handling web errors',
    () => {},
    shouldAdd => {
        for (let i = 0; i < browserErrorEvents.length; i++) {
            self.removeEventListener(
                browserErrorEvents[i],
                uncaughtErrorListener,
                true
            )

            if (shouldAdd) {
                self.addEventListener(
                    browserErrorEvents[i],
                    uncaughtErrorListener,
                    true
                )
            }
        }
    }
)

const handleServerErrors = tieUpEff(
    'handling server errors',
    () => {},
    shouldAdd => {
        for (let i = 0; i < nodeErrorEvents.length; i++) {
            process.removeListener(nodeErrorEvents[i], uncaughtErrorListener)

            if (shouldAdd) {
                process.on(nodeErrorEvents[i], uncaughtErrorListener)
            }
        }
    }
)

export const globalHandleErrors = tieUpEff(
    'handling listeners for uncaught errors',
    () => {},
    shouldAdd => {
        if (typeof shouldAdd !== 'boolean') {
            throw new TypeError('First argument needs to be boolean')
        }

        if (isWeb) {
            handleWebErrors(shouldAdd)
        }

        if (isServer) {
            handleServerErrors(shouldAdd)
        }
    }
)
