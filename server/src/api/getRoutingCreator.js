import { tieImpure, isServer, createDef, funcDef, strDef } from "tied-up"

const funcOrUndefDef = createDef({
    getMsg: arg =>
        typeof arg !== "function" && arg !== undefined
            ? "must be function or undefined"
            : "",
})

export const getRoutingCreator = tieImpure(
    "creating route for the server",
    [funcDef, funcOrUndefDef, strDef, strDef, funcDef],
    () => {},
    (app, onError_, method, path, callback) => {
        if (!isServer) {
            throw Error("This function is meant for server use")
        }

        const defaultOnError = props => {
            const { descr, error, args } = props

            const res = args[1]
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

        const onError = onError_ !== undefined ? onError_ : defaultOnError

        app[method](
            path,
            tieImpure(`${method.toUpperCase()} ${path}`, onError, callback)
        )
    }
)
