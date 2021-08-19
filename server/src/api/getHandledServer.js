import {
    tieEffPart,
    tiePure,
    isServer,
    nodeErrorEvents,
    or,
    isObj,
    isNil
} from 'tied-up'

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
    (server, sockets) => {
        or(isServer, Error('This function is meant for server use'))
        or(isObj(server), TypeError('First argument must be the server object.'))
        or(
            isNil(sockets) || sockets instanceof Set,
            TypeError('Second argument (if given) must be a Set.')
        )

        if (isNil(sockets)) {
            sockets = new Set()
        }

        server.on('connection', onConnection(sockets))

        for (let i = 0; i < nodeErrorEvents.length; i++) {
            process.prependListener(nodeErrorEvents[i], onClose(server, sockets))
        }

        return server
    }
)
