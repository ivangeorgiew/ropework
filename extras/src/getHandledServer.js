import { tieUp, isNodeJS, nodeErrorEvents } from 'tied-up'

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

        while (nodeErrorEvents.length - ++i) {
            process.prependListener(
                nodeErrorEvents[i],
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
