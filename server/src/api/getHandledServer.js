import {
    isFunc,
    isNil,
    isObj,
    isServer,
    nodeErrorEvents,
    or,
    tieImpure,
    tiePure,
} from 'tied-up'

const onConnection = tieImpure(
    'adding sockets to server',
    () => {},
    (sockets, socket) => {
        socket.on('close', () => {
            sockets.delete(socket)
        })

        sockets.add(socket)
    }
)

const onClose = tieImpure(
    'handling server closing',
    () => {},
    (server, sockets, event, _) => {
        server.close()

        sockets.forEach(socket => {
            socket.destroy()
        })

        process.removeListener(event, onClose(server, sockets, event))
    }
)

export const getHandledServer = tiePure(
    'initializing error handling for server',
    ({ args: [server] }) => server,
    (server, sockets_) => {
        or(isServer, Error('This function is meant for server use'))
        or(
            isObj(server) && isFunc(server.on) && isFunc(server.close),
            TypeError('First argument must be the server object.')
        )
        or(
            isNil(sockets_) || sockets_ instanceof Set,
            TypeError('Second argument (if given) must be a Set.')
        )

        const sockets = isNil(sockets_) ? new Set() : sockets_

        server.on('connection', onConnection(sockets))

        nodeErrorEvents.forEach(event => {
            process.prependListener(event, onClose(server, sockets, event))
        })

        return server
    }
)
