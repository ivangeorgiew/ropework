'use strict'

const pureErrorHandling = function ({ isProduction, notifyUser, loggingService } = {}) {
    isProduction = typeof isProduction === 'boolean' ? isProduction : true
    notifyUser = typeof notifyUser === 'function' ? notifyUser : () => {}
    loggingService = typeof loggingService === 'function' ? loggingService : () => {}

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
                    if (/^\s*async\s+/g.test(val)) {
                         return '[function Async]'
                    }

                    if (/^\s*class\s*\w*/g.test(val)) {
                        return '[function Class]'
                    }

                    if (/^\s*function\s*\*/g.test(val)) {
                        return '[function Generator]'
                    }

                    if (/^\s*\(.*\)\s+=>/g.test(val)) {
                        return '[function Arrow]'
                    }

                    return '[function Function]'
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

            loggingService(stringifyAll({
                ...commonProps,
                localUrl: window.location.href,
                machineInfo: {
                    browserInfo: window.navigator.userAgent,
                    language: window.navigator.language,
                    osType: window.navigator.platform
                }
            }))
        }

        if (isNodeJS) {
            loggingService(stringifyAll({
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
                return createFunc('Catching errors', onCatch)
                    .apply(this, args)
            }
        }

        if (onTry.constructor.name === 'AsyncFunction') {
            return async function(...args) {
                try {
                    return await onTry.apply(this, args)
                } catch(err) {
                    return innerCatch.call(this, { err, args })
                }
            }
        }

        return function(...args) {
            try {
                return onTry.apply(this, args)
            } catch(err) {
                return innerCatch.call(this, { err, args })
            }
        }
    }

    const createMethods = createFunc(
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
                createMethods(obj.prototype, false)
            }

            return obj
        },
        obj => obj
    )

    const getWrapApp = app => createFunc(
        'Wrapping the server',
        (method, path, onTry) => {
            app[method](path, createFunc(
                `app.${method}('${path}')`,
                onTry,
                (req, res) => {
                    if (!res.headersSent) {
                        res.status(500).json({ message: 'Server error' })
                    }
                }
            ))
        }
    )

    const initUncaughtErrorHandling = createFunc(
        'Initializing uncaught errors handling',
        server => {
            const sockets = new Set()

            const onUncaughtError = function(eventOrError) {
                const funcDesc = 'The app crashed, please restart!'

                if (isBrowser) {
                    eventOrError.preventDefault()

                    logError({ funcDesc, err: eventOrError.error || eventOrError.reason })

                    // prevent user from interacting with the page
                    if (isProduction) {
                        window.document.body.style['pointer-events'] = 'none'
                    }
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
        loggingService,
        createFunc,
        createMethods,
        getWrapApp,
        initUncaughtErrorHandling
    }
}

module.exports = pureErrorHandling
