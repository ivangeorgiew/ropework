import {
    isServer,
    objDef,
    strDef,
    funcDef,
    nodeErrorEvents,
    tieImpure,
    tiePure,
    createDef,
} from "tied-up"

const serverDef = createDef({
    ...objDef,
    strictProps: { on: funcDef, close: funcDef },
})
const setDef = createDef({
    getMsg: arg => (!(arg instanceof Set) ? "must be Set" : ""),
})
const setOrUndefDef = createDef({
    getMsg: arg =>
        !(arg instanceof Set) && arg !== undefined ? "must be Set or undefined" : "",
})

const onConnection = tieImpure(
    "adding sockets to server",
    [setDef, objDef],
    () => {},
    (sockets, socket) => {
        socket.on("close", () => {
            sockets.delete(socket)
        })

        sockets.add(socket)
    }
)

const onClose = tieImpure(
    "handling server closing",
    [serverDef, setDef, strDef],
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
    "initializing error handling for server",
    [serverDef, setOrUndefDef],
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
