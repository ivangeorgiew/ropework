import { isNodeJS, nodeEventNames } from './options'
import { tieUp } from './tieUp'

export const getHandledServer = tieUp({
    descr: 'initializing error handling for server',
    argTypes: '{ :on: (), :close: () }, @Set | undef',
    useCache: ([server]) => [server],
    onError: ({ args: [server] }) => server,
    data: function (server, sockets) {
        if (!isNodeJS) {
            throw new Error('This function is meant for NodeJS')
        }

        sockets = sockets instanceof Set ? sockets : new Set()

        server.on(
            'connection',
            tieUp({
                descr: 'adding sockets to server',
                argTypes: '{}',
                data: function (socket) {
                    sockets.add(socket)
                    socket.on('close', () => {
                        sockets.delete(socket)
                    })
                }
            })
        )

        let i = -1

        while (nodeEventNames.length - ++i) {
            process.prependListener(
                nodeEventNames[i],
                tieUp({
                    descr: 'handling server closing',
                    data: function () {
                        server.close()
                        sockets.forEach(socket => {
                            socket.destroy()
                        })
                    }
                })
            )
        }

        return server
    }
})

export const getRoutingCreator = tieUp({
    descr: 'creating function for routing',
    argTypes: '() | {}, () | undef',
    useCache: ([app]) => [app],
    onError: () => () => {},
    data: function (app, onError) {
        if (!isNodeJS) {
            throw new Error('This function is meant for NodeJS')
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

        return tieUp({
            descr: 'creating route for the server',
            argTypes: 'str, str, ()',
            data: function (method, path, callback) {
                app[method](
                    path,
                    tieUp({
                        descr: `${method.toUpperCase()} ${path}`,
                        onError,
                        data: callback
                    })
                )
            }
        })
    }
})
