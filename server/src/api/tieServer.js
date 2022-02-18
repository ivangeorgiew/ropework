import {
    isServer,
    objDef,
    strDef,
    funcDef,
    nodeErrorEvents,
    tieImpure,
    tiePure,
    setDef,
    createDef,
} from "tied-up"

const serverDef = createDef({
    strictProps: { on: funcDef, close: funcDef },
})
const setOrUndefDef = createDef({
    getMsg: arg =>
        !(arg instanceof Set) && arg !== undefined ? "must be Set or undefined" : "",
})

const onConnection = tieImpure(
    "adding sockets to server",
    [setDef, objDef],
    (sockets, socket) => {
        socket.on("close", () => {
            sockets.delete(socket)
        })

        sockets.add(socket)
    },
    () => {}
)

const onClose = tieImpure(
    "handling server closing",
    [serverDef, setDef, strDef],
    (server, sockets, eventName, _) => {
        server.close()

        sockets.forEach(socket => {
            socket.destroy()
        })

        process.removeListener(eventName, onClose(server, sockets, eventName))
    },
    () => {}
)

export const tieServer = tiePure(
    "tying server",
    [serverDef, setOrUndefDef],
    (server, sockets_) => {
        if (!isServer) {
            throw Error("This function is meant for server use")
        }

        const sockets = sockets_ !== undefined ? sockets_ : new Set()

        server.on("connection", onConnection(sockets))

        nodeErrorEvents.forEach(eventName => {
            process.prependListener(eventName, onClose(server, sockets, eventName))
        })

        return server
    },
    props => {
        const [server] = props.args

        return server
    }
)
