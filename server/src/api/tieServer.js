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

const onConnection = tieImpure({
    descr: "adding sockets to server",
    spec: [setDef, objDef],
    onTry: (sockets, socket) => {
        socket.on("close", () => {
            sockets.delete(socket)
        })

        sockets.add(socket)
    },
    onCatch: () => null,
})

const onClose = tieImpure({
    descr: "handling server closing",
    spec: [serverDef, setDef, strDef],
    onTry: (server, sockets, eventName, _) => {
        server.close()

        sockets.forEach(socket => {
            socket.destroy()
        })

        process.removeListener(eventName, onClose(server, sockets, eventName))
    },
    onCatch: () => null,
})

export const tieServer = tiePure({
    descr: "tying server",
    spec: [serverDef, setOrUndefDef],
    onTry: (server, sockets_) => {
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
    onCatch: props => {
        const [server] = props.args

        return server
    },
})
