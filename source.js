'use strict'

const getErrorHandling = function(params) {
    const isObject = val => typeof val !== 'function' && val === Object(val)

    const defaultLogger = isObject(console) && typeof console.error === 'function' ?
        console.error :
        () => {}

    params = isObject(params) ? params : {}

    const isProduction = typeof params.isProduction === 'boolean' ?
        params.isProduction :
        isObject(process) && isObject(process.env) ?
            process.env.NODE_ENV === 'production' :
            true

    const devErrorLogger = typeof params.devErrorLogger === 'function' ?
        function(...args) {
            try {
                params.devErrorLogger.apply(this, args)
            } catch(err) {
                if (!isProduction) {
                    defaultLogger(` Issue with: Parameter devErrorLogger\n`, err)
                    defaultLogger.apply(this, args)
                }
            }
        } :
        defaultLogger

    const onError = typeof params.onError === 'function' ?
        function(...args) {
            try {
                params.onError.apply(this, args)
            } catch(err) {
                if (!isProduction) {
                    devErrorLogger(` Issue with: Parameter onError\n`, err)
                }
            }
        } :
        () => {}

    const isBrowser = typeof window !== 'undefined'
        && ({}).toString.call(window) === '[object Window]'

    const isNodeJS = typeof global !== "undefined" 
        && ({}).toString.call(global) === '[object global]'

    const stringifyAll = function(data) {
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
        } catch(err) {
            return JSON.stringify('[object Cyclic]')
        }
    }

    const logError = function(params) {
        try {
            params = isObject(params) ? params : {}

            const descr = typeof params.descr === 'string' ?
                params.descr :
                'Unknown error'
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
                devErrorLogger(
                    ` Issue with: ${descr}\n Function arguments: ${stringOfArgs}\n`,
                    err
                )
            }

            const commonProps = {
                description: descr,
                arguments: args,
                date: (new Date()).toUTCString(),
                error: err
            }

            let prodMsg = stringifyAll(commonProps)

            if (isBrowser) {
                prodMsg = stringifyAll({
                    ...commonProps,
                    localUrl: window.location.href,
                    machineInfo: {
                        browserInfo: window.navigator.userAgent,
                        language: window.navigator.language,
                        osType: window.navigator.platform
                    }
                })
            }

            if (isNodeJS) {
                prodMsg = stringifyAll({
                    ...commonProps,
                    localUrl: __filename,
                    machineInfo: {
                        cpuArch: process.arch,
                        osType: process.platform,
                        depVersions: process.versions
                    }
                })
            }

            return { userMsg: `Issue with: ${descr}`, prodMsg }
        } catch(err) {
            const descr = 'Logging the errors'

            if (!isProduction) {
                devErrorLogger(` Issue with: ${descr}\n`, err)
            }

            return {
                userMsg: `Issue with: ${descr}`,
                prodMsg: stringifyAll({ description: descr, error: err })
            }
        }
    }

    const createFunc = function(descr, onTry, onCatch, shouldHandleArgs = false) {
        try {
            if (typeof onTry !== 'function') {
                logError({
                    descr: 'Undefined function',
                    err: new Error(`Instead of function was given ${onTry}`)
                })

                return function(){}
            }

            const innerCatch = function(err, args) {
                onError(logError({ descr, err, args }))

                if (typeof onCatch === 'function') {
                    return createFunc(`Catching errors at ${descr}`, onCatch)
                        .call(this, { descr, err, args })
                }
            }

            return function(...args) {
                try {
                    if (shouldHandleArgs) {
                        args = args.map(el => typeof el === 'function' ?
                            createFunc(`Executing argument of ${descr}`, el, onCatch) :
                            el
                        )
                    }
                } catch(err) {
                    logError({ descr: 'Error handling function arguments', err })
                }

                try {
                    const result = onTry.apply(this, args)

                    //if the function returns a promise
                    if (isObject(result) && typeof result.catch === 'function') {
                        return result.catch(err => innerCatch.apply(this, [err, args]))
                    }

                    return result
                } catch(err) {
                    return innerCatch.apply(this, [err, args])
                }
            }
        } catch(err) {
            logError({ descr: 'Error handling function', err })

            return typeof onTry === 'function' ? onTry : function(){}
        }
    }

    const createData = createFunc(
        'Creating wrapper for any data type',
        (...args) => {
            let [descr, data, onCatch] = args

            if (typeof descr !== 'string') {
                descr = 'Unknown action or data'
                data = args[0]
                onCatch = args[1]
            }

            if(Array.isArray(data)) {
                return data.map((el, idx) => createData(
                    `Executing element num ${idx} of ${descr}`,
                    el,
                    onCatch
                ))
            }

            if (typeof data === 'function' || isObject(data)) {
                const shouldHandleArgs = true
                const handledData = typeof data === 'function' ?
                    createFunc(descr, data, onCatch, shouldHandleArgs) :
                    {}

                const descriptors = Object.getOwnPropertyDescriptors(data)

                Object.keys(descriptors).forEach(key => {
                    if (descriptors[key].configurable) {
                        const value = typeof data[key] === 'function' ?
                            createFunc(
                                `Executing method ${key}`,
                                data[key],
                                data[key + 'Catch'] ?? onCatch,
                                shouldHandleArgs
                            ).bind(data) :
                            data[key]

                        Object.defineProperty(
                            handledData,
                            key,
                            Object.assign(descriptors[key], { value })
                        )
                    }
                })

                return handledData
            }

            return data
        },
        ({ args: [descr, data] }) => typeof descr === 'string' ? data : descr
    )

    const initUncaughtErrorHandling = createFunc(
        'Initializing uncaught error handling',
        params => {
            params = isObject(params) ? params : {}

            const server = isObject(params.server) ?
                params.server :
                { on: () => {}, close: () => {} }

            const onUncaughtError = typeof params.onUncaughtError === 'function' ?
                createFunc('Logging on uncaught errors', params.onUncaughtError) :
                onError

            const sockets = new Set()
            const handleUncaughtError = createFunc(
                'Handling uncaught errors',
                eventOrError => {
                    const descr = 'Running the app!!!'

                    if (isBrowser) {
                        if (eventOrError instanceof Event) {
                            eventOrError.preventDefault()

                            onUncaughtError(logError({
                                descr,
                                err: eventOrError.reason ?? eventOrError.error
                            }))
                        }

                        // prevent user from interacting with the page
                        window.document.body.style['pointer-events'] = 'none'
                    }

                    if (isNodeJS) {
                        server.close()
                        sockets.forEach(socket => { socket.destroy() })

                        let exitCode = 0

                        if (eventOrError instanceof Error) {
                            exitCode = 1

                            onUncaughtError(logError({ descr, err: eventOrError }))
                        }

                        setTimeout(() => { process.exit(exitCode) }, 1000).unref()
                    }
                }
            )

            if (isBrowser) {
                window.addEventListener('error', handleUncaughtError, true)
                window.addEventListener('unhandledrejection', handleUncaughtError, true)
            }

            if (isNodeJS) {
                server.on('connection', socket => {
                    sockets.add(socket);

                    socket.on('close', () => { sockets.delete(socket) })
                })

                process.on('uncaughtException', handleUncaughtError)
                process.on('unhandledRejection', handleUncaughtError)
                process.on('SIGTERM', handleUncaughtError)
                process.on('SIGINT', handleUncaughtError)
            }
        }
    )

    return {
        isProduction,
        devErrorLogger,
        onError,
        isObject,
        isBrowser,
        isNodeJS,
        stringifyAll,
        createData,
        initUncaughtErrorHandling
    }
}

module.exports = getErrorHandling
