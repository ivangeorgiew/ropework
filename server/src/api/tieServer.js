import {
    isServer,
    objDef,
    strDef,
    funcDef,
    nodeErrorEvents,
    tie,
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

const onConnection = tie({
    descr: "adding sockets to server",
    spec: [setDef, objDef],
    onTry: (sockets, socket) => {
        socket.on("close", () => {
            sockets.delete(socket)
        })

        sockets.add(socket)
    },
    onCatch: () => {},
})

const onClose = tie({
    descr: "handling server closing",
    spec: [serverDef, setDef, strDef],
    onTry: (server, sockets, eventName, _) => {
        server.close()

        sockets.forEach(socket => {
            socket.destroy()
        })

        process.removeListener(eventName, onClose(server, sockets, eventName))
    },
    onCatch: () => {},
})

export const tieServer = tie({
    descr: "tying server",
    spec: [serverDef, setOrUndefDef],
    isPure: true,
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
        const { areArgsValid, args, error } = props

        if (areArgsValid) return args[0]

        throw error
    },
})
