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

    const GeneratorFunction = (function * (){}).constructor
    const AsyncFunction = (async function (){}).constructor
    const AsyncGeneratorFunction = (async function * (){}).constructor

    const builtinPrototypes = [
        Object.prototype,
        Array.prototype,
        Function.prototype,
        AsyncFunction.prototype,
        GeneratorFunction.prototype,
        AsyncGeneratorFunction.prototype,
        GeneratorFunction.prototype.prototype,
        AsyncGeneratorFunction.prototype.prototype
    ]

    const overflowRegex = /(stack|recursion)/

    const lastError = { descr: '', message: '' }
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

    const cacheLimit = typeof props.cacheLimit === 'number' ?
        props.cacheLimit :
        1e5
    //end configuring arguments

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
                props.args.map(el => Array.isArray(el) ? 'array' : typeof el) :
                []

            const isOverflowAgain =
                error.message === lastError.message &&
                error.message.match(overflowRegex) !== null

            const isSameError =
                descr === lastError.descr &&
                error.message === lastError.message

            if (isDevelopment && !isSameError && !isOverflowAgain) {
                devLogger(
                    '\n',
                    'Issue with:', descr, '\n',
                    'Function arguments:', args, `\n`,
                    error, '\n'
                )
            }

            Object.assign(lastError, { descr, message: error.message })

            const isFriendly = error instanceof FriendlyError
            const userMsg = isFriendly ? error.message : `Issue with: ${descr}`
            const productionInfo = {
                description: descr,
                arguments: args,
                date: (new Date()).toUTCString(),
                error
            }

            if (isBrowser) {
                Object.assign(productionInfo, {
                    localUrl: window.location.href,
                    machineInfo: {
                        browserInfo: window.navigator.userAgent,
                        language: window.navigator.language,
                        osType: window.navigator.platform
                    }
                })
            }

            if (isNodeJS) {
                Object.assign(productionInfo, {
                    localUrl: process.cwd(),
                    machineInfo: {
                        cpuArch: process.arch,
                        osType: process.platform,
                        depVersions: process.versions
                    }
                })
            }

            notify({
                isDevelopment,
                isUncaught,
                isFriendly,
                userMsg,
                productionInfo,
                error
            })
        } catch(error) {
            if (isDevelopment) {
                devLogger(` Issue with: error logger\n`, error)
            }
        }
    }

    const createFunc = function(props) {
        try {
            props = isObject(props) ? props : {}

            const descr = typeof props.descr === 'string' ?
                props.descr :
                defaultDescr

            const onTry = typeof props.onTry === 'function' ?
                props.onTry :
                () => {}

            const onCatch = typeof props.onCatch === 'function' ?
                props.onCatch :
                () => {}

            const isPure = typeof props.getCacheKey === 'function'

            const getCacheKey = props.getCacheKey

            let cacheKeys = []
            let cacheValues = []

            const innerCatch = function(error, args) {
                logError({ descr, error, args })

                // clear the cache on overflows
                if (
                    isPure &&
                    error instanceof Error &&
                    error.message.match(overflowRegex) !== null
                ) {
                    cacheKeys = []
                    cacheValues = []
                }

                const handledOnCatch = createFunc({
                    descr: `catching errors for ${descr}`,
                    onTry: onCatch
                })

                return handledOnCatch({ descr, error, args })
            }

            const innerFunc = function(...args) {
                let curCacheKey
                let result

                if (isPure) {
                    try {
                        curCacheKey = [this].concat(getCacheKey({ descr, args }))

                        for (let i = 0; i < cacheKeys.length; i++) {
                            const cacheKey = cacheKeys[i]

                            if (cacheKey.length !== curCacheKey.length) {
                                continue
                            }

                            let areEqual = true

                            // cacheKey[0] is not an argument
                            for (let m = 0; m < cacheKey.length; m++) {
                                if (!Object.is(cacheKey[m], curCacheKey[m])) {
                                    areEqual = false
                                    break
                                }
                            }

                            if (areEqual) {
                                return cacheValues[i]
                            }
                        }
                    } catch(error) {
                        logError({ descr: 'retrieving result from cache', error, args })
                    }
                }

                try {
                    // if the function was called as constructor
                    if (new.target !== undefined) {
                        result = new function () {
                            const obj = new onTry(...args)

                            if (isObject(innerFunc.prototype)) {
                                Object.setPrototypeOf(obj, innerFunc.prototype)
                            }

                            return obj
                        }
                    } else {
                        result = onTry.apply(this, args)
                    }

                    // if the function returns a promise
                    if (
                        isObject(result) &&
                        typeof result.then === 'function' &&
                        typeof result.catch === 'function'
                    ) {
                        result = result.catch(function(error) {
                            return innerCatch.apply(this, [error, args])
                        })
                    }
                } catch(error) {
                    result = innerCatch.apply(this, [error, args])
                }

                if (isPure) {
                    try {
                        if (cacheKeys.length >= cacheLimit) {
                            cacheKeys.shift()
                            cacheValues.shift()
                        }

                        cacheKeys.push(curCacheKey)
                        cacheValues.push(result)
                    } catch(error) {
                        logError({ descr: 'assigning result to cache', error, args })
                    }
                }

                return result
            }

            return innerFunc
        } catch(error) {
            logError({ descr: 'error handling functions', error, args: [props] })

            return () => {}
        }
    }

    const tieUp = createFunc({
        descr: 'tying up data with error handling',
        onTry: function (props) {
            props = isObject(props) ? props : {}

            const onTry = props.onTry
            const onCatch = props.onCatch

            const descr = typeof props.descr === 'string' ?
                `[ ${typeof onTry}: ${props.descr} ]` :
                `[ ${typeof onTry}: ${defaultDescr} ]`

            const getCacheKey = typeof props.getCacheKey === 'function' ?
                props.getCacheKey :
                false

            if (isBrowser) {
                if (window.tp_tiedUp instanceof WeakSet) {
                    if (window.tp_tiedUp.has(onTry)) return onTry
                } else {
                    Object.defineProperty(window, 'tp_tiedUp', { value: new WeakSet() })
                }
            }

            if (isNodeJS) {
                if (global.tp_tiedUp instanceof WeakSet) {
                    if (global.tp_tiedUp.has(onTry)) return onTry
                } else {
                    Object.defineProperty(global, 'tp_tiedUp', { value: new WeakSet() })
                }
            }

            const createData = createFunc({
                descr: 'creating error handled data',
                onTry: function(props) {
                    props = isObject(props) ? props : {}

                    const { descr, onTry, onCatch, getCacheKey, refs } = props

                    if (typeof descr !== 'string' || !(refs instanceof WeakMap)) {
                        throw new Error('Incorrect props provided')
                    }

                    if (onTry instanceof Date) {
                        const copy = new Date()

                        copy.setTime(onTry.getTime())

                        return copy
                    }

                    if (onTry instanceof RegExp) {
                        const regExpText = String(onTry)
                        const lastSlashIdx = regExpText.lastIndexOf('/')

                        return new RegExp(
                            regExpText.slice(1, lastSlashIdx),
                            regExpText.slice(lastSlashIdx + 1)
                        )
                    }

                    if (!['object', 'function'].includes(typeof onTry) || onTry === null) {
                        return onTry
                    }

                    if (refs.has(onTry)) {
                        return refs.get(onTry)
                    }

                    const assignHandledProps = createFunc({
                        descr: 'assigning error handled properties',
                        onTry: function(source, target) {
                            const descriptors = Object.getOwnPropertyDescriptors(source)
                            const descriptorKeys = Object.getOwnPropertyNames(descriptors)
                                .concat(Object.getOwnPropertySymbols(descriptors))

                            for (let i = 0; i < descriptorKeys.length; i++) {
                                const key = descriptorKeys[i]

                                // in case target has the prop and is not configurable
                                try {
                                    let value = descriptors[key].value

                                    if (
                                        ['object', 'function'].includes(typeof value) &&
                                        value !== null
                                    ) {
                                        value = createData({
                                            // key can be a Symbol
                                            descr: `${descr}["${String(key)}"]`,
                                            onTry: value,
                                            onCatch,
                                            getCacheKey,
                                            refs
                                        })
                                    }

                                    Object.defineProperty(target, key, Object.assign(
                                        descriptors[key],
                                        ('value' in descriptors[key]) ? { value } : null
                                    ))
                                } catch(error) {
                                    logError({
                                        // key can be a Symbol
                                        descr: `assigning ${String(key)} to ${descr}`,
                                        error,
                                        args: [source, target]
                                    })
                                }
                            }
                        }
                    })

                    let handledData

                    if (typeof onTry === 'function') {
                        handledData = createFunc({
                            descr,
                            onTry,
                            onCatch,
                            getCacheKey
                        })
                    } else if (Array.isArray(onTry)) {
                        handledData = []
                    } else {
                        handledData = {}
                    }

                    refs.set(onTry, handledData)

                    assignHandledProps(onTry, handledData)

                    const dataProto = Object.getPrototypeOf(onTry)
                    let handledProto

                    if (dataProto === null || builtinPrototypes.includes(dataProto)) {
                        handledProto = dataProto
                    } else {
                        handledProto = createData({
                            descr: `prototype of (${descr})`,
                            onTry: dataProto,
                            onCatch,
                            getCacheKey,
                            refs
                        })
                    }

                    Object.setPrototypeOf(handledData, handledProto)

                    // constructor inside the prototype of a function should be
                    // the same as the function itself
                    if (
                        typeof onTry === 'function' &&
                        isObject(onTry.prototype) &&
                        onTry.prototype.constructor === onTry
                    ) {
                        Object.defineProperty(handledData.prototype, 'constructor', {
                            value: handledData,
                            writable: true,
                            configurable: true
                        })
                    }

                    return handledData
                },
                onCatch: function ({ args: [props] }) {
                    return isObject(props) ? props.onTry : undefined
                }
            })

            const handledData = createData({
                descr,
                onTry,
                onCatch,
                getCacheKey,
                refs: new WeakMap()
            })

            if (['object', 'function'].includes(handledData) && handledData !== null) {
                if (isBrowser) {
                    window.tp_tiedUp.add(handledData)
                }

                if (isNodeJS) {
                    global.tp_tiedUp.add(handledData)
                }
            }

            return handledData
        },
        onCatch: function ({ args: [props] }) {
            return isObject(props) ? props.onTry : undefined
        }
    })

    const getHandledServer = tieUp({
        descr: 'initializing error handling for server',
        onTry: function(server) {
            if (!isNodeJS) {
                throw new Error('This function is meant for NodeJS')
            }

            if (server.tp_isServerHandled) {
                return server
            }

            server = tieUp({ descr: 'HTTP server', onTry: server })

            const sockets = new Set()
            const serverErrorListener = tieUp({
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

                for (let i = 0; i < nodeEventNames.length; i++) {
                    const eventName = nodeEventNames[i]

                    process.prependListener(eventName, serverErrorListener)
                }
            }

            Object.defineProperty(server, 'tp_isServerHandled', { value: true })

            return server
        },
        onCatch: function({ args: [server] }) { return server }
    })

    const getRoutingCreator = tieUp({
        descr: 'creating function for routing',
        onTry: function (app, onCatch) {
            if (!isNodeJS) {
                throw new Error('This function is meant for NodeJS')
            }

            if (
                app === null ||
                !['object', 'function'].includes(typeof app) ||
                !['undefined', 'function'].includes(typeof onCatch)
            ) {
                throw new Error(
                    'Invalid parameters, expected: ' +
                    'app(function/object), onCatch(undefined/function)'
                )
            }

            if (onCatch === undefined) {
                onCatch = function ({ error, args: [_req, res] }) {
                    if (!res.headersSent) {
                        res.status(500).json({
                            errorName: 'Internal server error',
                            errorMessage: error.message,
                            stack: error.stack
                        })
                    }
                }
            }

            return tieUp({
                descr: 'creating route for the server',
                onTry: function (method, path, onTry) {
                    if (
                        typeof method !== 'string' ||
                        typeof path !== 'string' ||
                        typeof onTry !== 'function'
                    ) {
                        throw new Error(
                            'Invalid parameters provided, expected: ' +
                            'method(string), path(string), callback(function)'
                        )
                    }

                    app[method](path, tieUp({
                        descr: `${method.toUpperCase()} ${path}`,
                        onTry: onTry,
                        onCatch
                    }))
                }
            })
        },
        onCatch: function() { return () => {} }
    })

    const errorListener = tieUp({
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

    if (isBrowser && !window.tp_areUnhandledCaught) {
        for (let i = 0; i < browserEventNames.length; i++) {
            window.addEventListener(browserEventNames[i], errorListener, true)
        }

        Object.defineProperty(window, 'tp_areUnhandledCaught', { value: true })
    }

    if (isNodeJS && !global.tp_areUnhandledCaught) {
        for (let i = 0; i < nodeEventNames.length; i++) {
            process.on(nodeEventNames[i], errorListener)
        }

        Object.defineProperty(global, 'tp_areUnhandledCaught', { value: true })
    }

    return {
        isDevelopment,
        devLogger,
        notify,
        isObject,
        isBrowser,
        isNodeJS,
        FriendlyError,
        tieUp,
        getHandledServer,
        getRoutingCreator
    }
}

module.exports = tiedPants
