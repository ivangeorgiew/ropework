import { tieUpEff, tieUp, isServer, nodeErrorEvents } from 'tied-up'

export const getHandledServer = tieUp(
    'initializing error handling for server',
    ({ args: [server] }) => Object.assign({}, server),
    (server, sockets = new Set()) => {
        if (!isServer) {
            throw new Error('This function is meant for server use')
        }

        if (typeof server !== 'object' || server === null) {
            throw new TypeError('First argument must be the server object.')
        }

        if (sockets !== undefined && !(sockets instanceof Set)) {
            throw new TypeError('Second argument must be the sockets Set.')
        }

        const onConnection = tieUpEff(
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

        const onClose = tieUpEff(
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
