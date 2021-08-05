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
            onError = function ({ descr, args, error }) {
                const res = args[1]
                let message, stack

                if (error instanceof Error) {
                    message = error.message
                    stack = error.stack
                } else {
                    message = error
                    stack = ''
                }

                if (!res.headersSent) {
                    res.status(500).json({
                        error: {
                            name: `Server issue with: ${descr}`,
                            message,
                            stack
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
