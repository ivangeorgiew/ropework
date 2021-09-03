import {
    checkFunc,
    checkNil,
    checkObj,
    isServer,
    checkStr,
    isTest,
    nodeErrorEvents,
    orThrow,
    validateArgs,
    tieImpure,
    tiePure,
} from "tied-up"

const onConnectionSpec = [
    [arg => arg instanceof Set, "must be Set"],
    [checkObj, "must be object"],
]

const onConnection = tieImpure(
    "adding sockets to server",
    () => {},
    (sockets, socket) => {
        if (isTest) {
            validateArgs(onConnectionSpec, [sockets, socket])
        }

        socket.on("close", () => {
            sockets.delete(socket)
        })

        sockets.add(socket)
    }
)

const onCloseSpec = [
    [checkObj, "must be object"],
    [arg => arg instanceof Set, "must be Set"],
    [checkStr, "must be string"],
]

const onClose = tieImpure(
    "handling server closing",
    () => {},
    (server, sockets, event, _) => {
        if (isTest) {
            validateArgs(onCloseSpec, [server, sockets, event])
        }

        server.close()

        sockets.forEach(socket => {
            socket.destroy()
        })

        process.removeListener(event, onClose(server, sockets, event))
    }
)

const getHandledServerSpec = [
    [
        arg => checkObj(arg) && checkFunc(arg.on) && checkFunc(arg.close),
        "must be the server object.",
    ],
    [arg => checkNil(arg) || arg instanceof Set, "must be Set or undefined."],
]

export const getHandledServer = tiePure(
    "initializing error handling for server",
    props => {
        const { args } = props
        const [server] = args

        return server
    },
    (server, sockets_) => {
        validateArgs(getHandledServerSpec, [server, sockets_])

        orThrow(isServer, "This function is meant for server use")

        const sockets = checkNil(sockets_) ? new Set() : sockets_

        server.on("connection", onConnection(sockets))

        nodeErrorEvents.forEach(event => {
            process.prependListener(event, onClose(server, sockets, event))
        })

        return server
    }
)
