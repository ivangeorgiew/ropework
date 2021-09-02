import { tieImpure, isServer, or, checkFunc, checkNil, checkStr } from "tied-up"

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

export const getRoutingCreator = tieImpure(
    "creating route for the server",
    () => {},
    (app, onError_, method, path, callback) => {
        or(isServer, Error("This function is meant for server use"))
        or(checkFunc(app), TypeError("First argument must be a function"))
        or(
            checkFunc(onError_) || checkNil(onError_),
            TypeError("Second argument (if given) must be a function")
        )

        const onError = checkNil(onError_) ? defaultOnError : onError_

        or(checkStr(method), TypeError("First argument must be the method key."))
        or(checkStr(path), TypeError("Second argument must be the routing path."))
        or(checkFunc(callback), TypeError("Third argument must be the callback."))

        app[method](
            path,
            tieImpure(`${method.toUpperCase()} ${path}`, onError, callback)
        )
    }
)
