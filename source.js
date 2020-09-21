'use strict'

const tiedPants = function(props) {
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
        () => {}

    const defaultDescr = 'a part of the application'

    const browserEventNames = ['error', 'unhandledrejection']

    const nodeEventNames = ['uncaughtException', 'unhandledRejection', 'SIGTERM', 'SIGINT']

    const innerPropConfigs = {
        writable: true,
        configurable: true,
        enumerable: false
    }
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
        () => {}
    //end configuring arguments

    const flattenObject = function(target, source) {
        try {
            const descriptors = Object.getOwnPropertyDescriptors(source)

            Object.keys(descriptors).forEach(key => {
                // some props have getters that throw errors
                try {
                    const shouldAdd = descriptors[key].hasOwnProperty('value') &&
                        !target.hasOwnProperty(key)

                    Object.defineProperty(target, key, Object.assign(
                        { enumerable: true },
                        shouldAdd ? { value: source[key] } : null
                    ))
                } catch(e) {}
            })

            const proto = Object.getPrototypeOf(source)

            if (isObject(proto) && proto !== Object.prototype) {
                flattenObject(target, proto)
            }
        } catch(error) {
            if (isDevelopment) {
                devLogger(` Issue with: flattening object\n`, error)
            }
        }
    }

    const stringifyAll = function(data) {
        try {
            const seen = new WeakSet()
            const parser = function(_key, val) {
                if ([Infinity, NaN, null, undefined].includes(val)) {
                    return String(val)
                }

                if (typeof val === 'object' || typeof val === 'function') {
                    if (seen.has(val)) {
                        return undefined
                    }

                    seen.add(val)
                }

                if (typeof val === 'function') {
                    return val.name !== '' ?
                        `[Function: ${val.name}]` :
                        `[Function: ${val.toString()}]`
                }

                if (typeof val === 'object' && !Array.isArray(val)) {
                    flattenObject(val, val)

                    return Object.getOwnPropertyNames(val).sort()
                        .reduce((acc, key) => {
                            acc[key] = val[key]
                            return acc
                        }, {})
                }

                return val
            }

            return JSON.stringify(data, parser)
        } catch(error) {
            if (isDevelopment) {
                devLogger(` Issue with: stringifying data\n`, error)
            }

            return JSON.stringify('[unparsable data]')
        }
    }

    const logError = function(props) {
        setTimeout(() => {
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

                if (isDevelopment) {
                    devLogger(
                        '\n',
                        'Issue with:', descr, '\n',
                        'Function arguments:', args, `\n`,
                        error, '\n'
                    )
                }

                const isFriendly = error instanceof FriendlyError
                const userMsg = isFriendly ? error.message : `Issue with: ${descr}`

                let productionMsg = {
                    description: descr,
                    arguments: args,
                    date: (new Date()).toUTCString(),
                    error
                }

                if (isBrowser) {
                    productionMsg = {
                        ...productionMsg,
                        localUrl: window.location.href,
                        machineInfo: {
                            browserInfo: window.navigator.userAgent,
                            language: window.navigator.language,
                            osType: window.navigator.platform
                        }
                    }
                }

                if (isNodeJS) {
                    productionMsg = {
                        ...productionMsg,
                        localUrl: process.cwd(),
                        machineInfo: {
                            cpuArch: process.arch,
                            osType: process.platform,
                            depVersions: process.versions
                        }
                    }
                }

                productionMsg = stringifyAll(productionMsg)

                notify({ isDevelopment, isUncaught, isFriendly, userMsg, productionMsg, error })
            } catch(error) {
                if (isDevelopment) {
                    devLogger(` Issue with: error logger\n`, error)
                }
            }
        }, 0)
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
                        args = args.map((el, idx) => typeof el === 'function' ?
                            impureFunc(`argument ${idx} of ${descr}`, el, onCatch) :
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
                        return result.catch(function(error) {
                            return innerCatch.apply(this, [error, args])
                        })
                    }

                    return result
                } catch(error) {
                    return innerCatch.apply(this, [error, args])
                }
            }

            Object.defineProperties(innerFunc, {
                _isErrorHandled_: { ...innerPropConfigs, value: true },
                name: {
                    ...innerPropConfigs,
                    value: descr !== defaultDescr ? descr : onTry.name
                }
            })

            return innerFunc
        } catch(error) {
            logError({ descr: 'error handling functions', error })

            return typeof onTry === 'function' ? onTry : () => {}
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

            const innerFunc = impureFunc(
                descr,
                function(...args) {
                    const hasError = innerFunc._hasError_
                    const cache = innerFunc._cache_
                    const cacheLimit = innerFunc._cacheLimit_
                    //TODO: implement faster key generation (ex: WeakMap)
                    // const key = args[0]
                    const key = stringifyAll(args)

                    if (!hasError && cache.has(key)) {
                        return cache.get(key)
                    }

                    const result = onTry.apply(this, args)

                    if (cache.size >= cacheLimit) {
                        cache.clear()
                    }

                    cache.set(key, result)

                    return result
                },
                function({ descr, error, args }) {
                    // clear the cache on overflows
                    setTimeout(() => {
                        innerFunc._cache_.clear()
                        innerFunc._hasError_ = false
                    }, 0)

                    innerFunc._hasError_ = true

                    return onCatch.call(this, { descr, error, args })
                },
                shouldHandleArgs
            )

            Object.defineProperties(innerFunc, {
                _isCached_: { ...innerPropConfigs, value: true },
                _hasError_: { ...innerPropConfigs, value: false },
                _cache_: { ...innerPropConfigs, value: new Map() },
                _cacheLimit_: { ...innerPropConfigs, value: Infinity }
            })

            return innerFunc
        },
        function({ args: [descr, onTry] }) {
            return typeof descr === 'function' ?
                descr :
                typeof onTry === 'function' ? onTry : () => {}
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
        pureFunc,
        impureData,
        getHandledServer,
        catchUnhandled
    }
}

module.exports = tiedPants
