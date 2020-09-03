'use strict'

const getErrorHandling = function(params) {
    //start constants definitions
    const isObject = val => typeof val === 'object' && !Array.isArray(val) && val !== null

    const isBrowser = typeof window !== 'undefined'
        && ({}).toString.call(window) === '[object Window]'

    const isNodeJS = typeof global !== 'undefined' 
        && ({}).toString.call(global) === '[object global]'

    const FriendlyError = class extends Error {
        constructor(...args) {
            super(...args)
            this.name = 'FriendlyError'
        }
    }

    const defaultLogger = isObject(console) && typeof console.error === 'function' ?
        console.error :
        function(){}

    const defaultDescr = 'a part of the application'

    const browserEventNames = ['error', 'unhandledrejection']

    const nodeEventNames = ['uncaughtException', 'unhandledRejection', 'SIGTERM', 'SIGINT']
    //end constants definitions

    //start configuring arguments
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
            } catch(error) {
                if (isDevelopment) {
                    defaultLogger(` Issue with: parameter devErrorLogger\n`, error)
                    defaultLogger.apply(this, args)
                }
            }
        } :
        defaultLogger

    const notify = typeof params.notify === 'function' ?
        function(...args) {
            try {
                params.notify.apply(this, args)
            } catch(error) {
                if (isDevelopment) {
                    devErrorLogger(` Issue with: parameter notify\n`, error)
                }
            }
        } :
        function(){}
    //end configuring arguments

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
        } catch(error) {
            return JSON.stringify('[object Cyclic]')
        }
    }

    const logError = function(params) {
        try {
            params = isObject(params) ? params : {}

            const isUncaught = typeof params.isUncaught === 'boolean' ?
                params.isUncaught :
                false

            const descr = typeof params.descr === 'string' ?
                params.descr :
                isUncaught ? 'unhandled error' : defaultDescr

            const error = params.error instanceof Error ?
                params.error :
                isUncaught ? new Error('Uncaught error') : new Error('Unknown error')

            const args = Array.isArray(params.args) ?
                params.args.map(el => JSON.parse(stringifyAll(el))) :
                ['[unknown arguments]']

            const stringOfArgs = args.reduce((acc, arg, idx) => {
                const stringifiedArg = stringifyAll(arg)

                return idx === 0 ? `${acc} ${stringifiedArg}` : `${acc} , ${stringifiedArg}`
            }, '')

            if (isDevelopment) {
                devErrorLogger(
                    ` Issue with: ${descr}\n Function arguments: ${stringOfArgs}\n`,
                    error
                )
            }

            const commonProps = {
                description: descr,
                arguments: args,
                date: (new Date()).toUTCString(),
                error
            }

            const isFriendly = error instanceof FriendlyError

            const userMsg = isFriendly ? error.message : `Issue with: ${descr}`

            let productionMsg = stringifyAll(commonProps)

            if (isBrowser) {
                productionMsg = stringifyAll({
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
                productionMsg = stringifyAll({
                    ...commonProps,
                    localUrl: __filename,
                    machineInfo: {
                        cpuArch: process.arch,
                        osType: process.platform,
                        depVersions: process.versions
                    }
                })
            }

            notify({ isUncaught, isFriendly, userMsg, productionMsg, error })
        } catch(error) {
            if (isDevelopment) {
                devErrorLogger(` Issue with: error logger\n`, error)
            }
        }
    }

    const createFunc = function(descr, onTry, onCatch, shouldHandleArgs = false) {
        try {
            if (typeof onTry !== 'function') {
                throw new Error('Data given was not a function')
            }

            const innerCatch = function(error, args) {
                logError({ descr, error, args })

                if (typeof onCatch === 'function') {
                    return createFunc(`catching errors for ${descr}`, onCatch)
                        .call(this, { descr, error, args })
                }
                // else returns undefined
            }

            return function(...args) {
                try {
                    if (shouldHandleArgs) {
                        args = args.map(el => typeof el === 'function' ?
                            createFunc(`argument of ${descr}`, el, onCatch) :
                            el
                        )
                    }
                } catch(error) {
                    logError({ descr: 'error handling function arguments', error, args })
                }

                try {
                    const result = onTry.apply(this, args)

                    //if the function returns a promise
                    if (isObject(result) && typeof result.catch === 'function') {
                        return result.catch(error => innerCatch.apply(this, [error, args]))
                    }

                    return result
                } catch(error) {
                    return innerCatch.apply(this, [error, args])
                }
            }
        } catch(error) {
            logError({ descr: 'error handling functions', error })

            return typeof onTry === 'function' ? onTry : function(){}
        }
    }

    const createData = createFunc(
        'creating error handled data',
        (...args) => {
            let [descr, data, onCatch] = args

            if (typeof descr !== 'string' && typeof onCatch !== 'function') {
                descr = defaultDescr
                data = args[0]
                onCatch = args[1]
            }

            const shouldHandleArgs = true

            const assignHandledProps = createFunc(
                `assigning error handled properties to ${descr}`,
                (target, source) => {
                    const descriptors = Object.getOwnPropertyDescriptors(source)

                    Object.keys(descriptors).forEach(key => {
                        if (!descriptors[key].configurable) {
                            return
                        }

                        const value = typeof source[key] === 'function' ?
                            createFunc(
                                `method ${key} of ${descr}`,
                                source[key],
                                typeof source[key + 'Catch'] === 'function' ?
                                    source[key + 'Catch'] :
                                    onCatch,
                                shouldHandleArgs
                            ).bind(source) :
                            source[key]

                        Object.defineProperty(target, key, Object.assign(
                            descriptors[key],
                            descriptors[key].hasOwnProperty('value') ? { value } : null
                        ))
                    })

                    const proto = Object.getPrototypeOf(source)

                    if (isObject(proto)) {
                        assignHandledProps(Object.getPrototypeOf(target), proto)
                    }
                }
            )

            if(Array.isArray(data)) {
                return data.map((el, idx) => createData(
                    `element ${idx} of ${descr}`,
                    el,
                    onCatch
                ))
            }

            if (typeof data === 'function' || isObject(data)) {
                const handledData = typeof data === 'function' ?
                    createFunc(descr, data, onCatch, shouldHandleArgs) :
                    {}

                assignHandledProps(handledData, data)

                return handledData
            }

            return data
        },
        ({ args: [descr, data] }) => typeof descr === 'string' ? data : descr
    )

    const errorListener = createFunc(
        'listening for unexpected errors',
        eventOrError => {
            if (isBrowser) {
                if (eventOrError instanceof Event) {
                    eventOrError.stopImmediatePropagation()
                    eventOrError.preventDefault()

                    const error = eventOrError.reason instanceof Error ?
                        eventOrError.reason :
                        eventOrError.error instanceof Error ?
                            eventOrError.error :
                            undefined

                    logError({ isUncaught: true, error })
                }

                // prevent user from interacting with the page
                window.document.body.style['pointer-events'] = 'none'
            }

            if (isNodeJS) {
                let exitCode = 0

                if (eventOrError instanceof Error) {
                    exitCode = 1

                    logError({ isUncaught: true, error: eventOrError })
                }

                setTimeout(() => { process.exit(exitCode) }, 1000).unref()
            }
        }
    )

    const initUncaughtErrorHandling = createFunc(
        'initializing listening for unexpected errors',
        () => {
            if (isBrowser) {
                browserEventNames.forEach(eventName => {
                    if (typeof window._tp_errorListener_ === 'function') {
                        window.removeEventListener(eventName, window._tp_errorListener_, true)
                    }

                    window.addEventListener(eventName, errorListener, true)
                })

                window._tp_errorListener_ = errorListener
            }

            if (isNodeJS) {
                nodeEventNames.forEach(eventName => {
                    if (typeof global._tp_errorListener_ === 'function') {
                        process.removeListener(eventName, global._tp_errorListener_)
                    }

                    process.on(eventName, errorListener)
                })

                global._tp_errorListener_ = errorListener
            }
        }
    )

    const getHandledServer = createFunc(
        'initializing error handling for server',
        server => {
            server = isObject(server) ? server : { on: () => {}, close: () => {} }

            const sockets = new Set()
            const serverErrorListener = createFunc(
                'handling server closing',
                () => {
                    server.close()
                    sockets.forEach(socket => { socket.destroy() })
                }
            )

            if (isNodeJS) {
                server.on('connection', socket => {
                    sockets.add(socket);
                    socket.on('close', () => { sockets.delete(socket) })
                })

                nodeEventNames.forEach(eventName => {
                    process.prependListener(eventName, serverErrorListener)
                })
            }

            return server
        },
        ({ args: [server] }) => server
    )

    initUncaughtErrorHandling()

    return {
        isDevelopment,
        devErrorLogger,
        notify,
        isObject,
        isBrowser,
        isNodeJS,
        FriendlyError,
        stringifyAll,
        createData,
        getHandledServer
    }
}

module.exports = getErrorHandling
