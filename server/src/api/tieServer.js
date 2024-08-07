import { funcDef, isServer, nodeErrorEvents, objDef, setDef, strDef, tie, RETHROW } from "ropework"

const serverDef = { reqProps: { on: funcDef, close: funcDef } }
const setOrUndefDef = {
    getMsg: arg => (!(arg instanceof Set) && arg !== undefined ? "must be Set or undefined" : ""),
}

const onConnection = tie(
    "adding sockets to server",
    [setDef, objDef],
    (sockets, socket) => {
        socket.on("close", () => {
            sockets.delete(socket)
        })

        sockets.add(socket)
    },
    () => RETHROW
)

const onClose = tie(
    "handling server closing",
    [serverDef, setDef, strDef],
    (server, sockets, eventName, _) => {
        server.close()

        sockets.forEach(socket => {
            socket.destroy()
        })

        process.removeListener(eventName, onClose(server, sockets, eventName))
    },
    () => RETHROW
)

export const tieServer = tie(
    "pure tying server",
    [serverDef, setOrUndefDef],
    (server, sockets_) => {
        if (!isServer) {
            throw new Error("This function is meant for server use")
        }

        const sockets = sockets_ !== undefined ? sockets_ : new Set()

        server.on("connection", onConnection(sockets))

        nodeErrorEvents.forEach(eventName => {
            process.prependListener(eventName, onClose(server, sockets, eventName))
        })

        return server
    },
    props => {
        const server = props.args[0]

        return server
    }
)
