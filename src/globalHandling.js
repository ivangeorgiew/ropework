import {
    browserEventNames,
    isBrowser,
    isNodeJS,
    isWorker,
    nodeEventNames
} from './options'
import { tieUp } from './tieUp'
import { logError } from './utils/logging'

const uncaughtErrorListener = tieUp({
    descr: 'listening for uncaught errors',
    argTypes: '@Event | @Error | undef',
    data: function (eventOrError) {
        if (isBrowser || isWorker) {
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

            // prevent user from interacting with the page
            if (isBrowser) {
                window.document.body.style['pointer-events'] = 'none'
            }
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

if ((isBrowser || isWorker) && !self.tp_areUnhandledCaught) {
    let i = -1

    while (browserEventNames.length - ++i) {
        self.addEventListener(browserEventNames[i], uncaughtErrorListener, true)
    }

    Object.defineProperty(self, 'tp_areUnhandledCaught', {
        value: true,
        configurable: true
    })
}

if (isNodeJS && !global.tp_areUnhandledCaught) {
    let i = -1

    while (nodeEventNames.length - ++i) {
        process.on(nodeEventNames[i], uncaughtErrorListener)
    }

    Object.defineProperty(global, 'tp_areUnhandledCaught', {
        value: true,
        configurable: true
    })
}
