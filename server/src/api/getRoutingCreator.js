import {
    tieImpure,
    isServer,
    orThrow,
    validateArgs,
    checkFunc,
    checkNil,
    checkStr,
} from "tied-up"

const defaultOnError = tieImpure(
    "catching server errors",
    () => {},
    ({ descr, error, args: [, res] }) => {
        const message = error instanceof Error ? error.message : error
        const stack = error instanceof Error ? error.stack : ""

        if (!res.headersSent) {
            res.status(500).json({
                error: {
                    name: `Server issue with: ${descr}`,
                    message,
                    stack,
                },
            })
        }
    }
)

const getRoutingCreatorSpec = [
    [checkFunc, "First argument must be a function"],
    [
        arg => checkFunc(arg) || checkNil(arg),
        "Second argument must be a function or undefined",
    ],
    [checkStr, "Third argument must be string"],
    [checkStr, "Fourth argument must be string"],
    [checkFunc, "Fifth argument must be function"],
]

export const getRoutingCreator = tieImpure(
    "creating route for the server",
    () => {},
    (app, onError_, method, path, callback) => {
        validateArgs(getRoutingCreatorSpec, [app, onError_, method, path, callback])

        orThrow(isServer, "This function is meant for server use")

        const onError = checkNil(onError_) ? defaultOnError : onError_

        app[method](
            path,
            tieImpure(`${method.toUpperCase()} ${path}`, onError, callback)
        )
    }
)
