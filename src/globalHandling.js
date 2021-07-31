import {
    browserErrorEvents,
    isNodeJS,
    isWeb,
    nodeErrorEvents
} from './constants'
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

if (isWeb && !self.tp_areUnhandledCaught) {
    for (let i = 0; i < browserErrorEvents.length; i++) {
        self.addEventListener(
            browserErrorEvents[i],
            uncaughtErrorListener,
            true
        )
    }

    Object.defineProperty(self, 'tp_areUnhandledCaught', {
        value: true,
        configurable: true
    })
}

if (isNodeJS && !global.tp_areUnhandledCaught) {
    for (let i = 0; i < nodeErrorEvents.length; i++) {
        process.on(nodeErrorEvents[i], uncaughtErrorListener)
    }

    Object.defineProperty(global, 'tp_areUnhandledCaught', {
        value: true,
        configurable: true
    })
}
