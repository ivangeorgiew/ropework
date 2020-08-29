'use strict'

const pureErrorHandling = function({ isProduction, notifyUser, logInProd } = {}) {
    if (typeof isProduction !== 'boolean') {
        isProduction = typeof process === 'object' && typeof process.env === 'object' ?
            process.env.NODE_ENV === 'production' :
            true
    }

    if (typeof notifyUser !== 'function') {
        notifyUser = () => {}
    }

    if (typeof logInProd !== 'function') {
        logInProd = () => {}
    }

    const isBrowser = typeof window !== 'undefined'
        && ({}).toString.call(window) === '[object Window]'

    const isNodeJS = typeof global !== "undefined" 
        && ({}).toString.call(global) === '[object global]'

    const stringifyAll = function (data) {
        try {
            const parser = function(_key, val) {
                if (val instanceof Error) {
                    return Object.getOwnPropertyNames(val).reduce((acc, key) => {
                        acc[key] = val[key]
                        return acc
                    }, { stack: val.stack })
                }

                if (typeof val === 'function') {
                    return '[function]'
                }

                return val
            }

            return JSON.stringify(data, parser)
        } catch(e) {
            return JSON.stringify('[object Cyclic]')
        }
    }

    const logError = function (params) {
        params = params === Object(params) ? params : {}

        const funcDesc = typeof params.funcDesc === 'string' ?
            params.funcDesc :
            'Unknown function'
        const err = params.err instanceof Error ?
            params.err :
            new Error('Unknown error')
        const args = Array.isArray(params.args) ?
            params.args.map(el => JSON.parse(stringifyAll(el))) :
            ['[unknown]']

        const stringOfArgs = args.reduce((acc, arg, idx) => {
            const stringifiedArg = stringifyAll(arg)

            return idx === 0 ? `${acc} ${stringifiedArg}` : `${acc} , ${stringifiedArg}`
        }, '')

        if (!isProduction) {
            console.log()
            console.error(` Issue with: ${funcDesc}\n Function arguments: ${stringOfArgs}\n`, err)
            console.log()
        }

        const commonProps = {
            functionDescription: funcDesc,
            arguments: args,
            date: new Date().toUTCString(),
            error: err
        }

        if (isBrowser) {
            notifyUser(`Internal error with: ${funcDesc}`)

            if (isProduction) {
                logInProd(stringifyAll({
                    ...commonProps,
                    localUrl: window.location.href,
                    machineInfo: {
                        browserInfo: window.navigator.userAgent,
                        language: window.navigator.language,
                        osType: window.navigator.platform
                    }
                }))
            }
        }

        if (isNodeJS && isProduction) {
            logInProd(stringifyAll({
                ...commonProps,
                localUrl: __filename,
                machineInfo: {
                    cpuArch: process.arch,
                    osType: process.platform,
                    depVersions: process.versions
                }
            }))
        }
    }

    const createFunc = function(funcDesc, onTry, onCatch) {
        if (typeof onTry !== 'function') {
            logError({
                funcDesc: 'Undefined function',
                err: new Error(`Instead of function was given ${onTry}`)
            })

            return function() {}
        }

        const innerCatch = function({ err, args }) {
            logError({ funcDesc, err, args })

            if (typeof onCatch === 'function') {
                const catchFunc = createFunc('Catching errors', onCatch)

                return catchFunc.call(this, { funcDesc, err, args })
            }
        }

        return function(...args) {
            try {
                const result = onTry.apply(this, args)

                if (typeof result === 'object' && typeof result.catch === 'function') {
                    return result.catch(err => innerCatch.call(this, { err, args }))
                }

                return result
            } catch(err) {
                return innerCatch.call(this, { err, args })
            }
        }
    }

    const createObject = createFunc(
        'Error handling methods',
        (obj, shouldHandleProto = false) => {
            Object.getOwnPropertyNames(obj).forEach(key => {
                if (key !== 'constructor' && obj[key] instanceof Function) {
                    obj[key] = createFunc.call(obj,
                        `Executing method ${key}`,
                        obj[key],
                        obj[key + 'Catch']
                    )
                }
            })

            if(shouldHandleProto) {
                createObject(obj.prototype, false)
            }

            return obj
        },
        obj => obj
    )

    const createAppWrapper = app => createFunc(
        'Wrapping the server app',
        (method, path, onTry) => {
            if (typeof path === 'function') {
                onTry = path
                path = '/'
            }

            app[method](path, createFunc(
                `app.${method}('${path}')`,
                onTry,
                ({ err, args: [req, res] }) => {
                    if (!res.headersSent) {
                        res.status(500).json({ message: err.message })
                    }
                }
            ))
        }
    )

    const initUncaughtErrorHandling = createFunc(
        'Initializing uncaught errors handling',
        server => {
            const sockets = new Set()
            const onUncaughtError = createFunc(
                'Handling uncaught errors',
                eventOrError => {
                    const funcDesc = 'The app crashed, please restart!'

                    if (isBrowser) {
                        if (eventOrError instanceof Event) {
                            eventOrError.preventDefault()
                            logError({ funcDesc, err: eventOrError.reason || eventOrError.error })
                        }

                        // prevent user from interacting with the page
                        window.document.body.style['pointer-events'] = 'none'
                    }

                    if (isNodeJS) {
                        if (server === Object(server) && server.close) {
                            server.close()
                        }
                        if (sockets instanceof Set) {
                            sockets.forEach(socket => { socket.destroy() })
                        }

                        let exitCode = 0

                        if (eventOrError instanceof Error) {
                            exitCode = 1
                            logError({ funcDesc, err: eventOrError })
                        }

                        setTimeout(() => { process.exit(exitCode) }, 1000).unref()
                    }
                }
            )

            if (isBrowser) {
                window.addEventListener('error', onUncaughtError, true)
                window.addEventListener('unhandledrejection', onUncaughtError, true)
            }

            if (isNodeJS) {
                if (server === Object(server)) {
                    server.on('connection', socket => {
                        sockets.add(socket);

                        socket.on('close', () => { sockets.delete(socket) })
                    })
                }

                process.on('uncaughtException', onUncaughtError)
                process.on('unhandledRejection', onUncaughtError)
                process.on('SIGTERM', onUncaughtError)
                process.on('SIGINT', onUncaughtError)
            }
        }
    )

    return {
        isBrowser,
        isNodeJS,
        stringifyAll,
        logError,
        createFunc,
        createObject,
        createAppWrapper,
        initUncaughtErrorHandling
    }
}

module.exports = pureErrorHandling
