import {
    isFunc,
    isNil,
    isObj,
    isServer,
    nodeErrorEvents,
    or,
    tieEff,
    tiePure,
} from 'tied-up'

const onConnection = tieEff(
    'adding sockets to server',
    () => {},
    (sockets, socket) => {
        socket.on('close', () => {
            sockets.delete(socket)
        })
        sockets.add(socket)
    }
)

const onClose = tieEff(
    'handling server closing',
    () => {},
    (server, sockets, _) => {
        server.close()
        sockets.forEach(socket => {
            socket.destroy()
        })
    }
)

export const getHandledServer = tiePure(
    'initializing error handling for server',
    ({ args: [server] }) => server,
    (server, _sockets) => {
        or(isServer, Error('This function is meant for server use'))
        or(
            isObj(server) && isFunc(server.on) && isFunc(server.close),
            TypeError('First argument must be the server object.')
        )
        or(
            isNil(_sockets) || _sockets instanceof Set,
            TypeError('Second argument (if given) must be a Set.')
        )

        const sockets = isNil(_sockets) ? new Set() : _sockets

        server.on('connection', onConnection(sockets))

        for (let i = 0; i < nodeErrorEvents.length; i++) {
            process.prependListener(nodeErrorEvents[i], onClose(server, sockets))
        }

        return server
    }
)
