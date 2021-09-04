import {
    tieImpure,
    isServer,
    createValidator,
    checkNil,
    funcDef,
    strDef,
} from "tied-up"

const defaultOnError = tieImpure(
    "catching server errors",
    () => {},
    props => {
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
)

const getRoutingCreatorSpec = [
    funcDef,
    [
        arg => typeof arg === "function" || checkNil(arg),
        "must be function or undefined",
    ],
    strDef,
    strDef,
    funcDef,
]
const getRoutingCreatorValidate = createValidator(getRoutingCreatorSpec)

export const getRoutingCreator = tieImpure(
    "creating route for the server",
    () => {},
    (app, onError_, method, path, callback) => {
        getRoutingCreatorValidate(app, onError_, method, path, callback)

        if (!isServer) {
            throw Error("This function is meant for server use")
        }

        const onError = checkNil(onError_) ? defaultOnError : onError_

        app[method](
            path,
            tieImpure(`${method.toUpperCase()} ${path}`, onError, callback)
        )
    }
)
