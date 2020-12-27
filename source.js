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

    const cacheLimit = typeof props.cacheLimit === 'number' && props.cacheLimit > 0 ?
        props.cacheLimit :
        1e6
    //end configuring arguments

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
        }, 0)
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

            const getCacheKey = typeof props.getCacheKey === 'function' ?
                props.getCacheKey :
                () => []

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

                return createFunc({
                    descr: `catching errors for ${descr}`,
                    onTry: onCatch
                })({ descr, error, args })
            }

            const innerFunc = function(...args) {
                // creating more variables increases the stack
                // moving them outside of the function has negative effects
                const v = {
                    neededArgs: undefined,
                    curCacheKey: undefined,
                    result: undefined,
                    areEqual: undefined,
                    i: undefined,
                    m: undefined
                }

                if (isPure) {
                    try {
                        v.neededArgs = getCacheKey({ descr, args })

                        if (Array.isArray(v.neededArgs)) {
                            v.curCacheKey = [this].concat(v.neededArgs)
                        } else {
                            throw new Error(
                                'Result from getCacheKey needs to be an array ' +
                                'of the parameters used for creating a cache key'
                            )
                        }

                        //prevent error on stack overflow
                        v.i = (cacheKeys || []).length

                        while (v.i--) {
                            //prevent error on stack overflow
                            v.m = (cacheKeys[v.i] || []).length
                            v.areEqual = true

                            while (v.m--) {
                                if (!Object.is(cacheKeys[v.i][v.m], v.curCacheKey[v.m])) {
                                    v.areEqual = false
                                    break
                                }
                            }

                            if (v.areEqual) {
                                return cacheValues[v.i]
                            }
                        }
                    } catch(error) {
                        logError({ descr: 'retrieving result from cache', error, args })
                    }
                }

                try {
                    // if the function was called as constructor
                    if (new.target !== undefined) {
                        v.result = new function () {
                            const obj = new onTry(...args)

                            if (isObject(innerFunc.prototype)) {
                                Object.setPrototypeOf(obj, innerFunc.prototype)
                            }

                            return obj
                        }
                    } else {
                        v.result = onTry.apply(this, args)
                    }

                    // if the function returns a promise
                    if (
                        isObject(v.result) &&
                        typeof v.result.then === 'function' &&
                        typeof v.result.catch === 'function'
                    ) {
                        v.result = v.result.catch(function(error) {
                            return innerCatch(error, args)
                        })
                    }
                } catch(error) {
                    v.result = innerCatch(error, args)
                }

                if (isPure) {
                    try {
                        if (cacheKeys.length >= cacheLimit) {
                            cacheKeys.shift()
                            cacheValues.shift()
                        }

                        cacheKeys.push(v.curCacheKey)
                        cacheValues.push(v.result)
                    } catch(error) {
                        logError({ descr: 'assigning result to cache', error, args })
                    }
                }

                return v.result
            }

            return innerFunc
        } catch(error) {
            logError({ descr: 'error handling functions', error, args: [props] })

            return () => {}
        }
    }

    const tieUp = createFunc({
        descr: 'tying up data with error handling',
        getCacheKey: ({ args: [props] }) => [isObject(props) ? props.onTry : undefined],
        onTry: function (props) {
            props = isObject(props) ? props : {}

            const { onTry, onCatch, getCacheKey } = props

            if (
                !['object', 'function'].includes(typeof onTry) ||
                onTry === null
            ) {
                return onTry
            }

            const refs = new WeakMap()
            const descr = typeof props.descr === 'string' ?
                `[ ${typeof onTry}: ${props.descr} ]` :
                `[ ${typeof onTry}: ${defaultDescr} ]`

            const createData = createFunc({
                descr: 'creating error handled data',
                getCacheKey: ({ args: [props] }) =>
                    [isObject(props) ? props.onTry : undefined],
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

                    if (
                        !['object', 'function'].includes(typeof onTry) ||
                        onTry === null
                    ) {
                        return onTry
                    }

                    if (refs.has(onTry)) {
                        return refs.get(onTry)
                    }

                    const assignHandledProps = createFunc({
                        descr: 'assigning error handled properties',
                        getCacheKey: ({ args }) => args,
                        onTry: function(source, target) {
                            const descriptors = Object.getOwnPropertyDescriptors(source)
                            const descriptorKeys = Object
                                .getOwnPropertyNames(descriptors)
                                .concat(Object.getOwnPropertySymbols(descriptors))

                            let i = descriptorKeys.length

                            while (i--) {
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

            return createData({ descr, onTry, onCatch, getCacheKey, refs })
        },
        onCatch: function ({ args: [props] }) {
            return isObject(props) ? props.onTry : undefined
        }
    })

    const getHandledServer = tieUp({
        descr: 'initializing error handling for server',
        getCacheKey: ({ args: [server] }) => [server],
        onTry: function(server) {
            if (!isNodeJS) {
                throw new Error('This function is meant for NodeJS')
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

                let i = nodeEventNames.length

                while (i--) {
                    const eventName = nodeEventNames[i]

                    process.prependListener(eventName, serverErrorListener)
                }
            }

            return server
        },
        onCatch: function({ args: [server] }) { return server }
    })

    const getRoutingCreator = tieUp({
        descr: 'creating function for routing',
        getCacheKey: ({ args: [app] }) => [app],
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
                        res.status(500).json({ error: {
                            name: 'Internal server error',
                            message: error.message,
                            stack: error.stack
                        } })
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
        let i = browserEventNames.length

        while (i--) {
            window.addEventListener(browserEventNames[i], errorListener, true)
        }

        Object.defineProperty(window, 'tp_areUnhandledCaught', { value: true })
    }

    if (isNodeJS && !global.tp_areUnhandledCaught) {
        let i = nodeEventNames.length

        while (i--) {
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
