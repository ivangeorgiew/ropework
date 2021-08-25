import { tieEff, isServer, or, isFunc, isNil, isStr } from 'tied-up'

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
                    stack,
                },
            })
        }
    }
)

export const getRoutingCreator = tieEff(
    'creating route for the server',
    () => {},
    (app, _onError, method, path, callback) => {
        or(isServer, Error('This function is meant for server use'))
        or(isFunc(app), TypeError('First argument must be a function'))
        or(
            isFunc(_onError) || isNil(_onError),
            TypeError('Second argument (if given) must be a function')
        )

        const onError = isNil(_onError) ? defaultOnError : _onError

        or(isStr(method), TypeError('First argument must be the method key.'))
        or(isStr(path), TypeError('Second argument must be the routing path.'))
        or(isFunc(callback), TypeError('Third argument must be the callback.'))

        app[method](
            path,
            tieEff(`${method.toUpperCase()} ${path}`, onError, callback)
        )
    }
)
