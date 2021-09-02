import {
    checkFunc,
    checkNil,
    checkObj,
    isServer,
    checkStr,
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
            or(checkObj(socket), TypeError("Second arg must be object"))
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
            or(checkObj(server), TypeError("First arg must be object"))
            or(sockets instanceof Set, TypeError("Second arg must be Set"))
            or(checkStr(event), TypeError("Third arg must be string"))
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
            checkObj(server) && checkFunc(server.on) && checkFunc(server.close),
            TypeError("First argument must be the server object.")
        )
        or(
            checkNil(sockets_) || sockets_ instanceof Set,
            TypeError("Second argument (if given) must be a Set.")
        )

        const sockets = checkNil(sockets_) ? new Set() : sockets_

        server.on("connection", onConnection(sockets))

        nodeErrorEvents.forEach(event => {
            process.prependListener(event, onClose(server, sockets, event))
        })

        return server
    }
)
