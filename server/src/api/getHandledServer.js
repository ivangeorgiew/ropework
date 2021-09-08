import {
    isServer,
    objDef,
    strDef,
    funcDef,
    nodeErrorEvents,
    tieImpure,
    tiePure,
} from "tied-up"

const serverDef = [objDef[0], { on: funcDef, close: funcDef }]
const setDef = [arg => (arg instanceof Set ? "" : "must be Set")]

const onConnectionSpec = [setDef, objDef]

const onConnection = tieImpure(
    "adding sockets to server",
    onConnectionSpec,
    () => {},
    (sockets, socket) => {
        socket.on("close", () => {
            sockets.delete(socket)
        })

        sockets.add(socket)
    }
)

const onCloseSpec = [serverDef, setDef, strDef]

const onClose = tieImpure(
    "handling server closing",
    onCloseSpec,
    () => {},
    (server, sockets, event, _) => {
        server.close()

        sockets.forEach(socket => {
            socket.destroy()
        })

        process.removeListener(event, onClose(server, sockets, event))
    }
)

const getHandledServerSpec = [
    serverDef,
    [
        arg =>
            arg instanceof Set || arg === undefined
                ? ""
                : "must be Set or undefined",
    ],
]

export const getHandledServer = tiePure(
    "initializing error handling for server",
    getHandledServerSpec,
    props => props.args[0],
    (server, sockets_) => {
        if (!isServer) {
            throw Error("This function is meant for server use")
        }

        const sockets = sockets_ !== undefined ? sockets_ : new Set()

        server.on("connection", onConnection(sockets))

        nodeErrorEvents.forEach(event => {
            process.prependListener(event, onClose(server, sockets, event))
        })

        return server
    }
)
