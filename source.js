'use strict'

const getErrorHandling = function(props) {
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
    props = isObject(props) ? props : {}

    const isDevelopment = typeof props.isDevelopment === 'boolean' ?
        props.isDevelopment :
        isObject(process) && isObject(process.env) ?
            process.env.NODE_ENV !== 'production' :
            false

    const devLogger = typeof props.devLogger === 'function' ?
        function(...args) {
            try {
                props.devLogger.apply(this, args)
            } catch(error) {
                if (isDevelopment) {
                    defaultLogger(` Issue with: parameter devLogger\n`, error)
                    defaultLogger.apply(this, args)
                }
            }
        } :
        defaultLogger

    const notify = typeof props.notify === 'function' ?
        function(...args) {
            try {
                props.notify.apply(this, args)
            } catch(error) {
                if (isDevelopment) {
                    devLogger(` Issue with: parameter notify\n`, error)
                }
            }
        } :
        function(){}
    //end configuring arguments

    const stringifyAll = function(data, shouldIncludeFuncBody = false) {
        try {
            const parser = function(_key, val) {
                if (val instanceof Error) {
                    return Object.getOwnPropertyNames(val).reduce((acc, key) => {
                        acc[key] = val[key]
                        return acc
                    }, { stack: val.stack })
                }

                if (typeof val === 'function') {
                    if (shouldIncludeFuncBody) {
                        return val.name !== '' ?
                            `[Function ${val.name} ${val.toString()}]` :
                            `[Function unnamed ${val.toString()}]`
                    }

                    return val.name !== '' ?
                        `[Function ${val.name}]` :
                        `[Function unnamed]`
                }

                return val
            }

            return JSON.stringify(data, parser)
        } catch(error) {
            return JSON.stringify('[Object cyclic]')
        }
    }

    const logError = function(props) {
        try {
            props = isObject(props) ? props : {}

            const isUncaught = typeof props.isUncaught === 'boolean' ?
                props.isUncaught :
                false

            const descr = typeof props.descr === 'string' ?
                props.descr :
                isUncaught ? 'unhandled error' : defaultDescr

            const error = props.error instanceof Error ?
                props.error :
                isUncaught ? new Error('Uncaught error') : new Error('Unknown error')

            const args = Array.isArray(props.args) ?
                props.args.map(el => JSON.parse(stringifyAll(el))) :
                ['[unknown arguments]']

            const stringOfArgs = args.reduce((acc, arg, idx) => {
                const stringifiedArg = stringifyAll(arg)

                return idx === 0 ? stringifiedArg : `${acc} , ${stringifiedArg}`
            }, '')

            if (isDevelopment) {
                devLogger(
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
                    localUrl: process.cwd(),
                    machineInfo: {
                        cpuArch: process.arch,
                        osType: process.platform,
                        depVersions: process.versions
                    }
                })
            }

            notify({ isDevelopment, isUncaught, isFriendly, userMsg, productionMsg, error })
        } catch(error) {
            if (isDevelopment) {
                devLogger(` Issue with: error logger\n`, error)
            }
        }
    }

    const impureFunc = function(descr, onTry, onCatch, shouldHandleArgs = false) {
        try {
            if (typeof onTry !== 'function') {
                throw new Error('Data given was not a function')
            }

            if (onTry._isErrorHandled_) {
                return onTry
            }

            const innerCatch = function(error, args) {
                logError({ descr, error, args })

                if (typeof onCatch === 'function') {
                    return impureFunc(`catching errors for ${descr}`, onCatch)
                        .call(this, { descr, error, args })
                }

                return undefined
            }

            const innerFunc = function(...args) {
                try {
                    if (shouldHandleArgs) {
                        args = args.map(el => typeof el === 'function' ?
                            impureFunc(`argument of ${descr}`, el, onCatch) :
                            el
                        )
                    }
                } catch(error) {
                    logError({ descr: 'error handling function arguments', error, args })
                }

                try {
                    const result = onTry.apply(this, args)

                    // if the function returns a promise
                    if (isObject(result) && typeof result.catch === 'function') {
                        return result.catch(error => innerCatch.apply(this, [error, args]))
                    }

                    return result
                } catch(error) {
                    return innerCatch.apply(this, [error, args])
                }
            }

            innerFunc._isErrorHandled_ = true

            return innerFunc
        } catch(error) {
            logError({ descr: 'error handling functions', error })

            return typeof onTry === 'function' ? onTry : function(){}
        }
    }

    const pureFunc = impureFunc(
        'creating a pure function with cached results',
        function(...params) {
            let [descr, onTry, onCatch] = params

            if (typeof descr !== 'string' && typeof onCatch !== 'function') {
                descr = defaultDescr
                onTry = params[0]
                onCatch = params[1]
            }

            if (typeof onTry !== 'function') {
                throw new Error('Data given was not a function')
            }

            if (onTry._isCached_) {
                return onTry
            }

            const shouldHandleArgs = true
            const shouldIncludeFuncBody = true
            const funcToCache = impureFunc(descr, onTry, onCatch, shouldHandleArgs)

            const innerFunc = impureFunc(
                'caching pure function',
                function(...args) {
                    const cachedKeys = innerFunc._cache_.keys
                    const cachedResults = innerFunc._cache_.results
                    const key = stringifyAll(args, shouldIncludeFuncBody)
                    const idx = cachedKeys.indexOf(key)

                    if (idx < 0) {
                        let result

                        try {
                            result = funcToCache.apply(this, args)
                        } finally {
                            // larger than that may begin to slow down
                            if (cachedKeys.length > 1e6) {
                                cachedKeys.shift()
                                cachedResults.shift()
                            }

                            cachedKeys.push(key)
                            cachedResults.push(result)

                            return result
                        }
                    }

                    return cachedResults[idx]
                }
            )

            innerFunc._isCached_ = true
            innerFunc._cache_ = { keys: [], results: [] }

            Object.seal(innerFunc)

            return innerFunc
        },
        function({ args: [_descr, onTry] }) {
            return typeof onTry === 'function' ? onTry : function(){}
        }
    )

    const impureData = impureFunc(
        'creating error handled data',
        function(...params) {
            let [descr, data, onCatch] = params

            if (typeof descr !== 'string' && typeof onCatch !== 'function') {
                descr = defaultDescr
                data = params[0]
                onCatch = params[1]
            }

            const shouldHandleArgs = true

            const assignHandledProps = impureFunc(
                `assigning error handled properties to ${descr}`,
                function(target, source) {
                    const descriptors = Object.getOwnPropertyDescriptors(source)

                    Object.keys(descriptors).forEach(key => {
                        // some props have getters that throw errors
                        // we don't need them anyways
                        try {
                            const value = typeof source[key] === 'function' ?
                                impureFunc(
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
                        } catch(e) {}
                    })

                    const proto = Object.getPrototypeOf(source)

                    if (isObject(proto) && proto !== Object.prototype) {
                        assignHandledProps(Object.getPrototypeOf(target), proto)
                    }
                }
            )

            if(Array.isArray(data)) {
                return data.map((el, idx) => impureData(`element ${idx} of ${descr}`, el, onCatch))
            }

            if (typeof data === 'function' || isObject(data)) {
                const handledData = typeof data === 'function' ?
                    impureFunc(descr, data, onCatch, shouldHandleArgs) :
                    {}

                assignHandledProps(handledData, data)

                return handledData
            }

            return data
        },
        function({ args: [descr, data, onCatch] }) {
            return typeof descr !== 'string' && typeof onCatch !== 'function' ? descr : data
        }
    )

    const errorListener = impureFunc(
        'listening for unexpected errors',
        function(eventOrError) {
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

    const catchUnhandled = impureFunc(
        'initializing listening for unexpected errors',
        function() {
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

    const getHandledServer = impureFunc(
        'initializing error handling for server',
        function(server) {
            server = isObject(server) ? server : { on: () => {}, close: () => {} }

            const sockets = new Set()
            const serverErrorListener = impureFunc(
                'handling server closing',
                function() {
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
        function({ args: [server] }) { return server }
    )

    return {
        isDevelopment,
        devLogger,
        notify,
        isObject,
        isBrowser,
        isNodeJS,
        FriendlyError,
        stringifyAll,
        pureFunc,
        impureData,
        getHandledServer,
        catchUnhandled
    }
}

module.exports = getErrorHandling
