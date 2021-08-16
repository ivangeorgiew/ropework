import { logError } from '../utils/logging'
import { browserErrorEvents, isServer, isWeb, nodeErrorEvents } from './constants'
import { tieEff } from './tie'

const uncaughtErrorListener = tieEff(
    'listening for uncaught errors',
    () => {},
    eventOrError => {
        if (isWeb) {
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
        } else if (isServer) {
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
    }
)

export const globalHandleErrors = tieEff(
    'handling listeners for uncaught errors',
    () => {},
    shouldAdd => {
        if (typeof shouldAdd !== 'boolean') {
            throw new TypeError('First argument needs to be boolean')
        }

        if (isWeb) {
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
        } else if (isServer) {
            for (let i = 0; i < nodeErrorEvents.length; i++) {
                process.removeListener(nodeErrorEvents[i], uncaughtErrorListener)

                if (shouldAdd) {
                    process.on(nodeErrorEvents[i], uncaughtErrorListener)
                }
            }
        }
    }
)
