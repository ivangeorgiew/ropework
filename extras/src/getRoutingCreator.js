import { tieUp, isNodeJS } from 'tied-up'

export const getRoutingCreator = tieUp({
    descr: 'creating function for routing',
    argTypes: '() | {}, () | undef',
    useCache: ([app]) => [app],
    onError: () => () => {},
    data: function (app, onError) {
        if (!isNodeJS) {
            throw new Error('This function is meant for NodeJS')
        }

        if (onError === undefined) {
            onError = function ({ args, error }) {
                const res = args[1]

                if (!res.headersSent) {
                    res.status(500).json({
                        error: {
                            name: 'Internal server error',
                            message: error?.message ?? error,
                            stack: error?.stack ?? ''
                        }
                    })
                }
            }
        }

        return tieUp({
            descr: 'creating route for the server',
            argTypes: 'str, str, ()',
            data: function (method, path, callback) {
                app[method](
                    path,
                    tieUp({
                        descr: `${method.toUpperCase()} ${path}`,
                        onError,
                        data: callback
                    })
                )
            }
        })
    }
})
