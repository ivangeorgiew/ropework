import { isNodeJS, nodeEventNames } from './constants'
import { tieUp } from './tieUp'

export const getHandledServer = tieUp(
    'initializing error handling for server',
    function (server, sockets) {
        if (!isNodeJS) {
            throw new Error('This function is meant for NodeJS')
        }

        sockets = sockets instanceof Set ? sockets : new Set()

        server.on(
            'connection',
            tieUp('adding sockets to server', function (socket) {
                sockets.add(socket)
                socket.on('close', () => {
                    sockets.delete(socket)
                })
            })
        )

        let i = -1

        while (nodeEventNames.length - ++i) {
            process.prependListener(
                nodeEventNames[i],
                tieUp('handling server closing', function () {
                    server.close()
                    sockets.forEach(socket => {
                        socket.destroy()
                    })
                })
            )
        }

        return server
    },
    {
        useCache: ([server]) => [server],
        onError: ({ args: [server] }) => server
    }
)

export const getRoutingCreator = tieUp(
    'creating function for routing',
    function (app, onError) {
        if (!isNodeJS) {
            throw new Error('This function is meant for NodeJS')
        }

        if (
            app === null ||
            !['object', 'function'].includes(typeof app) ||
            !['undefined', 'function'].includes(typeof onError)
        ) {
            throw new Error(
                'Invalid parameters, expected: ' +
                    'app(function|object), onError(undefined|function)'
            )
        }

        if (onError === undefined) {
            onError = function ({ args, error }) {
                const res = args[1]

                if (!res.headersSent) {
                    res.status(500).json({
                        error: {
                            name: 'Internal server error',
                            message: error?.message ?? error,
                            stack: error?.stack ?? ''
                        }
                    })
                }
            }
        }

        return tieUp(
            'creating route for the server',
            function (method, path, callback) {
                if (
                    typeof method !== 'string' ||
                    typeof path !== 'string' ||
                    typeof callback !== 'function'
                ) {
                    throw new Error(
                        'Invalid parameters provided, expected: ' +
                            'method(string), path(string), callback(function)'
                    )
                }

                app[method](
                    path,
                    tieUp(`${method.toUpperCase()} ${path}`, callback, {
                        onError
                    })
                )
            }
        )
    },
    { onError: () => () => {}, useCache: ([app]) => [app] }
)
