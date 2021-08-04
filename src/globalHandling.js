import { browserErrorEvents, isNodeJS, isWeb, nodeErrorEvents } from './constants'
import { tieUp } from './tieUp'
import { logError } from './utils/logging'

const uncaughtErrorListener = tieUp({
    descr: 'listening for uncaught errors',
    argTypes: '@Event | @Error | undef',
    data: function (eventOrError) {
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
                        : new Error('Uncaught error')
            }

            logError({ descr: 'unhandled error', error })
        }

        if (isNodeJS) {
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
})

export const handleUncaughtErrors = tieUp({
    descr: 'adding event listeners for uncaught errors',
    argTypes: 'bool | undef',
    data: function (shouldAdd = true) {
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
        }

        if (isNodeJS) {
            for (let i = 0; i < nodeErrorEvents.length; i++) {
                process.removeListener(nodeErrorEvents[i], uncaughtErrorListener)

                if (shouldAdd) {
                    process.on(nodeErrorEvents[i], uncaughtErrorListener)
                }
            }
            // TODO: try to remove stdout/stderr messages on overflow in promise
        }
    }
})

handleUncaughtErrors(true)
