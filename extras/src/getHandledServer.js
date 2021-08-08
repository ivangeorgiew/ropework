import { tieUp, tieUpMemo, isNodeJS, nodeErrorEvents } from 'tied-up'

export const getHandledServer = tieUpMemo(
    'initializing error handling for server',
    ([server]) => [server],
    ({ args: [server] }) => {
        if (typeof server === 'object' && server !== null) {
            return server
        }

        return {}
    },
    (server, sockets = new Set()) => {
        if (!isNodeJS) {
            throw new Error('This function is meant for NodeJS')
        }

        if (typeof server !== 'object' || server === null) {
            throw new TypeError('First argument must be the server object')
        }

        if (sockets !== undefined && !(sockets instanceof Set)) {
            throw new TypeError('Second argument must be the sockets Set')
        }

        const onConnection = tieUp(
            'adding sockets to server',
            () => {},
            socket => {
                socket.on('close', () => {
                    sockets.delete(socket)
                })
                sockets.add(socket)
            }
        )

        server.on('connection', onConnection)

        const onClose = tieUp(
            'handling server closing',
            () => {},
            () => {
                server.close()
                sockets.forEach(socket => {
                    socket.destroy()
                })
            }
        )

        for (let i = 0; i < nodeErrorEvents.length; i++) {
            process.prependListener(nodeErrorEvents[i], onClose)
        }

        return server
    }
)
