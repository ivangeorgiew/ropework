import { createDef, funcDef, isServer, objTypeDef, strDef, tieImpure } from "tied-up"

const funcOrUndefDef = createDef({
    getMsg: arg =>
        typeof arg !== "function" && arg !== undefined
            ? "must be function or undefined"
            : "",
})

export const createServerRoute = tieImpure({
    descr: "creating route for the server",
    spec: [funcDef, funcOrUndefDef, strDef, strDef, funcDef],
    onTry: (app, onCatch_, method, path, callback) => {
        if (!isServer) {
            throw Error("This function is meant for server use")
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
            tieImpure({
                descr: `${method.toUpperCase()} ${path}`,
                spec: [objTypeDef, objTypeDef],
                onTry: callback,
                onCatch: onCatch_ !== undefined ? onCatch_ : defaultOnCatch,
            })
        )
    },
    onCatch: () => {},
})
