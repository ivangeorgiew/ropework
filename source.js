'use strict'

const getErrorHandling = function(params) {
    const isObject = val => typeof val !== 'function' && val === Object(val)

    const defaultDescr = 'unnamed entity'

    const defaultLogger = isObject(console) && typeof console.error === 'function' ?
        console.error :
        () => {}

    params = isObject(params) ? params : {}

    const isDevelopment = typeof params.isDevelopment === 'boolean' ?
        params.isDevelopment :
        isObject(process) && isObject(process.env) ?
            process.env.NODE_ENV !== 'production' :
            false

    const devErrorLogger = typeof params.devErrorLogger === 'function' ?
        function(...args) {
            try {
                params.devErrorLogger.apply(this, args)
            } catch(err) {
                if (isDevelopment) {
                    defaultLogger(` Issue with: parameter devErrorLogger\n`, err)
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
                if (isDevelopment) {
                    devErrorLogger(` Issue with: parameter onError\n`, err)
                }
            }
        } :
        () => {}

    const isBrowser = typeof window !== 'undefined'
        && ({}).toString.call(window) === '[object Window]'

    const isNodeJS = typeof global !== 'undefined' 
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
                defaultDescr
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

            if (isDevelopment) {
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
            if (isDevelopment) {
                devErrorLogger(` Issue with: error logger\n`, err)
            }

            return {
                userMsg: `Issue with: ${defaultDescr}`,
                prodMsg: stringifyAll({ description: descr, error: err })
            }
        }
    }

    const createFunc = function(descr, onTry, onCatch, shouldHandleArgs = false) {
        try {
            if (typeof onTry !== 'function') {
                logError({ err: new Error(`Instead of function was given ${onTry}`) })

                return function(){}
            }

            const innerCatch = function(err, args) {
                onError(logError({ descr, err, args }))

                if (typeof onCatch === 'function') {
                    return createFunc(`catching errors for ${descr}`, onCatch)
                        .call(this, { descr, err, args })
                }
            }

            return function(...args) {
                try {
                    if (shouldHandleArgs) {
                        args = args.map(el => typeof el === 'function' ?
                            createFunc(`argument of ${descr}`, el, onCatch) :
                            el
                        )
                    }
                } catch(err) {
                    logError({ descr: 'error handling function arguments', err })
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
            logError({ descr: 'error handling function', err })

            return typeof onTry === 'function' ? onTry : function(){}
        }
    }

    const createData = createFunc(
        'creating error handled data',
        (...args) => {
            let [descr, data, onCatch] = args

            if (typeof descr !== 'string') {
                descr = defaultDescr
                data = args[0]
                onCatch = args[1]
            }

            if(Array.isArray(data)) {
                return data.map((el, idx) => createData(
                    `element ${idx} of ${descr}`,
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
                    if (!descriptors[key].configurable) {
                        return
                    }

                    const value = typeof data[key] === 'function' ?
                        createFunc(
                            `method ${key}`,
                            data[key],
                            data[key + 'Catch'] ?? onCatch,
                            shouldHandleArgs
                        ).bind(data) :
                        data[key]

                    Object.defineProperty(handledData, key, Object.assign(
                        descriptors[key],
                        descriptors[key].hasOwnProperty('value') ? { value } : null
                    ))
                })

                return handledData
            }

            return data
        },
        ({ args: [descr, data] }) => typeof descr === 'string' ? data : descr
    )

    const initUncaughtErrorHandling = createFunc(
        'initializing uncaught error handling',
        () => {
            const innerListener = createFunc(
                'handling uncaught errors',
                eventOrError => {
                    const descr = 'uncaught error'

                    if (isBrowser) {
                        if (eventOrError instanceof Event) {
                            eventOrError.stopImmediatePropagation()
                            eventOrError.preventDefault()

                            onError(logError({
                                descr,
                                err: eventOrError.reason ?? eventOrError.error
                            }))
                        }

                        // prevent user from interacting with the page
                        window.document.body.style['pointer-events'] = 'none'
                    }

                    if (isNodeJS) {
                        let exitCode = 0

                        if (eventOrError instanceof Error) {
                            exitCode = 1

                            onError(logError({ descr, err: eventOrError }))
                        }

                        setTimeout(() => { process.exit(exitCode) }, 1000).unref()
                    }
                }
            )

            if (isBrowser) {
                window.addEventListener('error', innerListener, true)
                window.addEventListener('unhandledrejection', innerListener, true)
            }

            if (isNodeJS) {
                process.on('uncaughtException', innerListener)
                process.on('unhandledRejection', innerListener)
                process.on('SIGTERM', innerListener)
                process.on('SIGINT', innerListener)
            }
        }
    )

    const getHandledServer = createFunc(
        'initializing error handling for server',
        server => {
            server = isObject(server) ? server : {}

            const sockets = new Set()

            const innerServerListener = createFunc(
                'handling server closing',
                eventOrError => {
                    if (typeof server.close === 'function') {
                        server.close()
                    }

                    sockets.forEach(socket => { socket.destroy() })
                }
            )

            if (typeof server.on === 'function') {
                server.on('connection', socket => {
                    sockets.add(socket);
                    socket.on('close', () => { sockets.delete(socket) })
                })
            }

            if (isNodeJS) {
                process.prependListener('uncaughtException', innerServerListener)
                process.prependListener('unhandledRejection', innerServerListener)
                process.prependListener('SIGTERM', innerServerListener)
                process.prependListener('SIGINT', innerServerListener)
            }

            return server
        },
        ({ args: [server] }) => server
    )

    initUncaughtErrorHandling()

    return {
        isDevelopment,
        devErrorLogger,
        onError,
        isObject,
        isBrowser,
        isNodeJS,
        stringifyAll,
        createData,
        getHandledServer
    }
}

module.exports = getErrorHandling
