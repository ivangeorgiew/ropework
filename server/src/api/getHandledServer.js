import {
    checkNil,
    isServer,
    objDef,
    strDef,
    isTest,
    funcDef,
    nodeErrorEvents,
    createValidator,
    tieImpure,
    tiePure,
} from "tied-up"

const onConnectionSpec = [[arg => arg instanceof Set, "must be Set"], objDef]
const onConnectionValidate = createValidator(onConnectionSpec)

const onConnection = tieImpure(
    "adding sockets to server",
    () => {},
    (sockets, socket) => {
        if (isTest) {
            onConnectionValidate(sockets, socket)
        }

        socket.on("close", () => {
            sockets.delete(socket)
        })

        sockets.add(socket)
    }
)

const onCloseSpec = [objDef, [arg => arg instanceof Set, "must be Set"], strDef]
const onCloseValidate = createValidator(onCloseSpec)

const onClose = tieImpure(
    "handling server closing",
    () => {},
    (server, sockets, event, _) => {
        if (isTest) {
            onCloseValidate(server, sockets, event)
        }

        server.close()

        sockets.forEach(socket => {
            socket.destroy()
        })

        process.removeListener(event, onClose(server, sockets, event))
    }
)

const getHandledServerSpec = [
    { on: funcDef, close: funcDef },
    [arg => arg instanceof Set || checkNil(arg), "must be Set or undefined."],
]
const getHandledServerValidate = createValidator(getHandledServerSpec)

export const getHandledServer = tiePure(
    "initializing error handling for server",
    props => {
        const { args } = props
        const [server] = args

        return server
    },
    (server, sockets_) => {
        getHandledServerValidate(server, sockets_)

        if (!isServer) {
            throw Error("This function is meant for server use")
        }

        const sockets = checkNil(sockets_) ? new Set() : sockets_

        server.on("connection", onConnection(sockets))

        nodeErrorEvents.forEach(event => {
            process.prependListener(event, onClose(server, sockets, event))
        })

        return server
    }
)
