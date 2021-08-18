import { tieEffPart, tiePure, isServer, nodeErrorEvents } from 'tied-up'

const onConnection = tieEffPart(
    'adding sockets to server',
    () => {},
    sockets => socket => {
        socket.on('close', () => {
            sockets.delete(socket)
        })
        sockets.add(socket)
    }
)

const onClose = tieEffPart(
    'handling server closing',
    () => {},
    (server, sockets) => () => {
        server.close()
        sockets.forEach(socket => {
            socket.destroy()
        })
    }
)

export const getHandledServer = tiePure(
    'initializing error handling for server',
    ({ args: [server] }) => server,
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

        server.on('connection', onConnection(sockets))

        for (let i = 0; i < nodeErrorEvents.length; i++) {
            process.prependListener(nodeErrorEvents[i], onClose(server, sockets))
        }

        return server
    }
)
