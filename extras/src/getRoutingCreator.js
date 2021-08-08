import { tieUp, tieUpMemo, isNodeJS } from 'tied-up'

const defaultOnError = tieUp(
    'catching errors for ',
    () => {},
    ({ descr, args, error }) => {
        const res = args[1]
        const message = error instanceof Error ? error.message : error
        const stack = error instanceof Error ? error.stack : ''

        if (!res.headersSent) {
            res.status(500).json({
                error: {
                    name: `Server issue with: ${descr}`,
                    message,
                    stack
                }
            })
        }
    }
)

export const getRoutingCreator = tieUpMemo(
    'creating function for routing',
    ([app]) => [app],
    () => () => {},
    (app, onError) => {
        if (!isNodeJS) {
            throw new Error('This function is meant for NodeJS')
        }

        if (typeof app !== 'function') {
            throw new TypeError('First argument must be a function')
        }

        if (typeof onError !== 'function') {
            onError = defaultOnError
        }

        return tieUp(
            'creating route for the server',
            () => {},
            (method, path, callback) => {
                if (typeof method !== 'string') {
                    throw new TypeError('First argument must be the method key')
                }

                if (typeof path !== 'string') {
                    throw new TypeError('Second argument must be the routing path')
                }

                if (typeof callback !== 'function') {
                    throw new TypeError(
                        'Third argument must be the callback function'
                    )
                }

                app[method](
                    path,
                    tieUp(`${method.toUpperCase()} ${path}`, onError, callback)
                )
            }
        )
    }
)
