import { funcDef, isServer, objTypeDef, strDef, tie } from "ropework"

const funcOrUndefDef = {
    getMsg: arg =>
        typeof arg !== "function" && arg !== undefined
            ? "must be function or undefined"
            : "",
}

export const createServerRoute = tie(
    "creating route for the server",
    [funcDef, funcOrUndefDef, strDef, strDef, funcDef],
    (app, onCatch_, method, path, callback) => {
        if (!isServer) {
            throw new Error("This function is meant for server use")
        }

        const defaultOnCatch = props => {
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

        app[method](
            path,
            tie(
                `${method.toUpperCase()} ${path}`,
                [objTypeDef, objTypeDef],
                callback,
                onCatch_ !== undefined ? onCatch_ : defaultOnCatch
            )
        )
    },
    () => {}
)
