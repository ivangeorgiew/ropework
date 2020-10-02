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

    const stringifyAll = function(data) {
        try {
            const seen = new WeakSet()
            const parser = function(_key, val) {
                if ([Infinity, NaN, null, undefined].includes(val)) {
                    return String(val)
                }

                if (typeof val === 'bigint') {
                    return Number(val)
                }

                if (typeof val === 'object' || typeof val === 'function') {
                    if (seen.has(val)) {
                        return undefined
                    }

                    seen.add(val)

                    if (typeof val === 'function') {
                        return `[Function: ${val.name}]`
                    }
                }

                return val
            }

            return JSON.stringify(data, parser)
        } catch(error) {
            if (isDevelopment) {
                devLogger(` Issue with: stringifying data\n`, error)
            }

            return JSON.stringify(`[Unparsed ${typeof data}]`)
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
                    []

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

    const createFunc = function(props) {
        try {
            props = isObject(props) ? props : {}

            const isPure = typeof props.isPure === 'boolean' ?
                props.isPure :
                false

            const descr = typeof props.descr === 'string' ?
                props.descr :
                defaultDescr

            const onTry = typeof props.onTry === 'function' ?
                props.onTry :
                () => {}

            const onCatch = typeof props.onCatch === 'function' ?
                props.onCatch :
                () => {}

            if (onTry._isHandled_) {
                return onTry
            }

            let hasError = false
            let cache = {}
            let cacheKeys = []
            let cacheId = 0

            const innerCatch = function(error, args) {
                logError({ descr, error, args })

                // clear the cache on overflows
                if (isPure) {
                    hasError = true

                    setTimeout(() => {
                        cache = {}
                        cacheKeys = []
                        cacheId = 0
                        hasError = false
                    }, 0)
                }

                return createFunc({ descr: `catching errors for ${descr}`, onTry: onCatch })
                    .call(this, { descr, error, args })
            }

            const innerFunc = function(...args) {
                let cacheKey
                let result

                if (isPure) {
                    try {
                        const CACHE_ID_KEY = '_cacheId_'

                        cacheKey = args.reduce((acc, el, idx) => {
                            let str

                            if (
                                (typeof el === 'object' || typeof el === 'function') &&
                                el !== null
                            ) {
                                if (typeof el[CACHE_ID_KEY] !== 'number') {
                                    Object.defineProperty(el, CACHE_ID_KEY, { value: ++cacheId })
                                }

                                str = `[${typeof el}: ${el[CACHE_ID_KEY]}]`
                            } else {
                                str = String(el)
                            }

                            return idx === 0 ? acc + str : acc + ' - ' + str
                        }, '')

                        if (!hasError && (cacheKey in cache)) {
                            return cache[cacheKey]
                        }
                    } catch(error) {
                        logError({ descr: 'retrieving result from cache', error, args })
                    }
                }

                try {
                    result = onTry.apply(this, args)

                    // if the function returns a promise
                    if (isObject(result) && typeof result.catch === 'function') {
                        result = result.catch(function(error) {
                            return innerCatch.apply(this, [error, args])
                        })
                    }
                } catch(error) {
                    result = innerCatch.apply(this, [error, args])
                }

                if (isPure) {
                    try {
                        const cacheLimit = typeof innerFunc.cacheLimit === 'number' ?
                            innerFunc.cacheLimit :
                            1e5

                        if (cacheKeys.length >= cacheLimit) {
                            delete cache[cacheKeys[0]]
                            cacheKeys.shift()
                        }

                        if (typeof cacheKey === 'string') {
                            cache[cacheKey] = result
                            cacheKeys.push(cacheKey)
                        }
                    } catch(e) {
                        logError({ descr: 'assigning result to cache', error, args })
                    }
                }

                return result
            }

            Object.defineProperties(innerFunc, {
                length: { configurable: true, value: onTry.length },
                name: { configurable: true, value: onTry.name },
                cacheLimit: { configurable: true, writable: true, value: 1e5 },
                _isHandled_: { value: true },
                _cache_: { value: cache },
            })

            return innerFunc
        } catch(error) {
            logError({ descr: 'error handling functions', error, args: Array.from(arguments) })

            return () => {}
        }
    }

    const createData = createFunc({
        descr: 'creating error handled data',
        onTry: function(...params) {
            let [isPure, descr, data, onCatch] = params

            if (typeof descr !== 'string' && typeof onCatch !== 'function') {
                descr = defaultDescr
                data = params[1]
                onCatch = params[2]
            }

            const assignHandledProps = createFunc({
                descr: `assigning error handled properties to ${descr}`,
                onTry: function(target, source) {
                    const descriptors = Object.getOwnPropertyDescriptors(source)

                    Object.keys(descriptors).forEach(key => {
                        // some props have getters that throw errors
                        try {
                            let value

                            if (typeof source[key] === 'object' && source[key] !== null) {
                                value = source[key]
                                // value = createData(
                                //     isPure,
                                //     `method ${key} of ${descr}`,
                                //     source[key],
                                //     onCatch
                                // )
                            } else if (typeof source[key] === 'function') {
                                value = createData(
                                    isPure,
                                    `method ${key} of ${descr}`,
                                    source[key],
                                    typeof source[key + 'Catch'] === 'function' ?
                                        source[key + 'Catch'] :
                                        onCatch
                                ).bind(source)
                            } else {
                                value = source[key]
                            }

                            Object.defineProperty(target, key, Object.assign(
                                descriptors[key],
                                ('value' in descriptors[key]) ? { value } : null
                            ))
                        } catch(e) {}
                    })

                    const proto = Object.getPrototypeOf(source)

                    if (
                        isObject(proto) &&
                        proto !== Object.prototype &&
                        proto !== Function.prototype
                    ) {
                        assignHandledProps(Object.getPrototypeOf(target), proto)
                    }
                }
            })

            if ((typeof data === 'function' || typeof data === 'object') && data !== null) {
                let handledData

                if (Array.isArray(data)) {
                    handledData = data.forEach((el, idx) => {
                        data[idx] = createData(
                            isPure,
                            `element ${idx} of ${descr}`,
                            el,
                            onCatch
                        )
                    })
                } else if (typeof data === 'object') {
                    handledData = {}
                } else {
                    handledData = createFunc({ isPure, descr, onTry: data, onCatch })
                }

                assignHandledProps(handledData, data)

                return handledData
            }

            return data
        },
        onCatch: function({ args: [descr, data, onCatch] }) {
            return typeof descr !== 'string' && typeof onCatch !== 'function' ? descr : data
        }
    })

    const pureData = createData.bind(this, true)
    const impureData = createData.bind(this, false)

    const errorListener = createFunc({
        descr: 'listening for unexpected errors',
        onTry: function(eventOrError) {
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
    })

    const catchUnhandled = createFunc({
        descr: 'initializing listening for unexpected errors',
        onTry: function() {
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
    })

    const getHandledServer = createFunc({
        descr: 'initializing error handling for server',
        onTry: function(server) {
            server = isObject(server) ? server : { on: () => {}, close: () => {} }

            const sockets = new Set()
            const serverErrorListener = createFunc({
                descr: 'handling server closing',
                onTry: function() {
                    server.close()
                    sockets.forEach(socket => { socket.destroy() })
                }
            })

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
        onCatch: function({ args: [server] }) { return server }
    })

    return {
        isDevelopment,
        devLogger,
        notify,
        isObject,
        isBrowser,
        isNodeJS,
        FriendlyError,
        pureData,
        impureData,
        catchUnhandled,
        getHandledServer
    }
}

module.exports = tiedPants
