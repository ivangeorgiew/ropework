import {
    isFunc,
    isNil,
    isObj,
    isServer,
    isStr,
    isTest,
    nodeErrorEvents,
    or,
    tieImpure,
    tiePure,
} from "tied-up"

const onConnection = tieImpure(
    "adding sockets to server",
    () => {},
    (sockets, socket) => {
        if (isTest) {
            or(sockets instanceof Set, TypeError("First arg must be Set"))
            or(isObj(socket), TypeError("Second arg must be object"))
        }

        socket.on("close", () => {
            sockets.delete(socket)
        })

        sockets.add(socket)
    }
)

const onClose = tieImpure(
    "handling server closing",
    () => {},
    (server, sockets, event, _) => {
        if (isTest) {
            or(isObj(server), TypeError("First arg must be object"))
            or(sockets instanceof Set, TypeError("Second arg must be Set"))
            or(isStr(event), TypeError("Third arg must be string"))
        }

        server.close()

        sockets.forEach(socket => {
            socket.destroy()
        })

        process.removeListener(event, onClose(server, sockets, event))
    }
)

export const getHandledServer = tiePure(
    "initializing error handling for server",
    ({ args: [server] }) => server,
    (server, sockets_) => {
        or(isServer, Error("This function is meant for server use"))
        or(
            isObj(server) && isFunc(server.on) && isFunc(server.close),
            TypeError("First argument must be the server object.")
        )
        or(
            isNil(sockets_) || sockets_ instanceof Set,
            TypeError("Second argument (if given) must be a Set.")
        )

        const sockets = isNil(sockets_) ? new Set() : sockets_

        server.on("connection", onConnection(sockets))

        nodeErrorEvents.forEach(event => {
            process.prependListener(event, onClose(server, sockets, event))
        })

        return server
    }
)
