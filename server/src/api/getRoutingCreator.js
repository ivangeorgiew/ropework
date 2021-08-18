import { tieEff, tieEffPart, isServer } from 'tied-up'

const defaultOnError = tieEff(
    'catching server errors',
    () => {},
    ({ descr, error, args: [, res] }) => {
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

export const getRoutingCreator = tieEffPart(
    'creating route for the server',
    () => {},
    (app, onError) => {
        if (!isServer) {
            throw new Error('This function is meant for server use')
        }

        if (typeof app !== 'function') {
            throw new TypeError('First argument must be a function')
        }

        if (typeof onError !== 'function') {
            onError = defaultOnError
        }

        return (method, path, callback) => {
            if (typeof method !== 'string') {
                throw new TypeError('First argument must be the method key.')
            }

            if (typeof path !== 'string') {
                throw new TypeError('Second argument must be the routing path.')
            }

            if (typeof callback !== 'function') {
                throw new TypeError('Third argument must be the callback.')
            }

            app[method](
                path,
                tieEff(`${method.toUpperCase()} ${path}`, onError, callback)
            )
        }
    }
)
