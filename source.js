module.exports = (props) => {
    'use strict'

    // start constants definitions
    const isObject = val => typeof val === 'object' && !Array.isArray(val) && val !== null

    const isBrowser = typeof window !== 'undefined' &&
        ({}).toString.call(window) === '[object Window]'

    const isNodeJS = typeof global !== 'undefined' &&
        ({}).toString.call(global) === '[object global]'

    const FriendlyError = class extends Error {
        constructor (...args) {
            super(...args)
            this.name = 'FriendlyError'
        }
    }

    const defaultLogger = isObject(console) && typeof console.error === 'function'
        ? console.error
        : () => {}

    const defaultDescr = '(part of the app)'

    const browserEventNames = ['error', 'unhandledrejection']

    const nodeEventNames = ['uncaughtException', 'unhandledRejection', 'SIGTERM', 'SIGINT']

    const GeneratorFunction = function * () {}.constructor
    const AsyncFunction = async function () {}.constructor
    const AsyncGeneratorFunction = async function * () {}.constructor

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
    // end constants definitions

    // start configuring arguments
    props = Object.assign({}, props)

    const isDevelopment = typeof props.isDevelopment === 'boolean'
        ? props.isDevelopment
        : isObject(process) && isObject(process.env)
            ? process.env.NODE_ENV !== 'production'
            : false

    const devLogger = typeof props.devLogger === 'function'
        ? function (...args) {
            try {
                props.devLogger.apply(this, args)
            } catch (error) {
                if (isDevelopment) {
                    defaultLogger(' Issue with: parameter devLogger\n', error)
                    defaultLogger.apply(this, args)
                }
            }
        }
        : defaultLogger

    const notify = typeof props.notify === 'function'
        ? function (...args) {
            try {
                props.notify.apply(this, args)
            } catch (error) {
                if (isDevelopment) {
                    devLogger(' Issue with: parameter notify\n', error)
                }
            }
        }
        : () => {}

    const cacheLimit = typeof props.cacheLimit === 'number' && props.cacheLimit > 0
        ? props.cacheLimit
        : 1e6
    // end configuring arguments

    const logError = function (props) {
        setTimeout(() => {
            try {
                props = Object.assign({}, props)

                const isUncaught = typeof props.isUncaught === 'boolean'
                    ? props.isUncaught
                    : false

                const descr = typeof props.descr === 'string'
                    ? props.descr
                    : isUncaught ? 'unhandled error' : defaultDescr

                const error = props.error instanceof Error
                    ? props.error
                    : isUncaught ? new Error('Uncaught error') : new Error('Unknown error')

                const args = Array.isArray(props.args)
                    ? props.args.map(el => Array.isArray(el) ? 'array' : typeof el)
                    : []

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
                        'Function arguments:', args, '\n',
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
            } catch (error) {
                if (isDevelopment) {
                    devLogger(' Issue with: error logger\n', error, '\n')
                }
            }
        }, 0)
    }

    const createFunc = function (props) {
        try {
            props = Object.assign({}, props)

            const descr = typeof props.descr === 'string'
                ? props.descr
                : defaultDescr

            const data = typeof props.data === 'function'
                ? props.data
                : () => {}

            const onCatch = typeof props.onCatch === 'function'
                ? props.onCatch
                : () => {}

            const useCache = props.useCache

            let cacheKeys = []
            let cacheValues = []

            const innerCatch = function (error, args) {
                logError({ descr, error, args })

                // clear the cache on overflows
                if (
                    typeof useCache === 'function' &&
                    isObject(error) &&
                    typeof error.message === 'string' &&
                    error.message.match(overflowRegex) !== null
                ) {
                    cacheKeys = []
                    cacheValues = []
                }

                return createFunc({
                    descr: `catching errors for ${descr}`,
                    data: onCatch
                })({ descr, error, args })
            }

            return function innerFunc (...args) {
                // creating more variables hurts performance
                const v = {
                    neededArgs: undefined,
                    curCacheKey: undefined,
                    result: undefined,
                    areEqual: undefined,
                    i: undefined,
                    m: undefined
                }

                if (typeof useCache === 'function') {
                    try {
                        v.neededArgs = useCache(args)

                        if (Array.isArray(v.neededArgs)) {
                            v.curCacheKey = [this].concat(v.neededArgs)

                            // prevent error on stack overflow
                            v.i = Array.isArray(cacheKeys)
                                ? cacheKeys.length
                                : 0

                            while (v.i--) {
                                v.areEqual = true
                                // prevent error on stack overflow
                                v.m = Array.isArray(cacheKeys[v.i])
                                    ? cacheKeys[v.i].length
                                    : 0

                                while (v.m--) {
                                    if (!Object.is(
                                        cacheKeys[v.i][v.m],
                                        v.curCacheKey[v.m]
                                    )) {
                                        v.areEqual = false
                                        break
                                    }
                                }

                                if (v.areEqual) {
                                    return cacheValues[v.i]
                                }
                            }
                        }
                    } catch (error) {
                        logError({ descr: 'retrieving result from cache', error, args })
                    }
                }

                try {
                    // if the function was called as constructor
                    if (new.target !== undefined) {
                        v.result = new function () {
                            const obj = new data(...args)

                            if (isObject(innerFunc.prototype)) {
                                Object.setPrototypeOf(obj, innerFunc.prototype)
                            }

                            return obj
                        }()
                    } else {
                        v.result = data.apply(this, args)
                    }

                    // if the function returns a promise
                    if (
                        isObject(v.result) &&
                        typeof v.result.then === 'function' &&
                        typeof v.result.catch === 'function'
                    ) {
                        v.result = v.result.catch(function (error) {
                            return innerCatch(error, args)
                        })
                    }
                } catch (error) {
                    v.result = innerCatch(error, args)
                }

                if (Array.isArray(v.curCacheKey)) {
                    try {
                        if (cacheKeys.length >= cacheLimit) {
                            cacheKeys.shift()
                            cacheValues.shift()
                        }

                        cacheKeys.push(v.curCacheKey)
                        cacheValues.push(v.result)
                    } catch (error) {
                        logError({ descr: 'assigning result to cache', error, args })
                    }
                }

                return v.result
            }
        } catch (error) {
            logError({ descr: 'error handling functions', error, args: [props] })

            return () => {}
        }
    }

    const tieUp = createFunc({
        descr: 'tying up data with error handling',
        useCache: ([descr, data]) => [typeof descr !== 'string' ? descr : data],
        data: function (descr, data, options) {
            if (typeof descr !== 'string') {
                descr = defaultDescr
                data = arguments[0]
                options = arguments[1]
            } else {
                descr = `(${descr})`
            }

            if (
                !['object', 'function'].includes(typeof data) ||
                data === null
            ) {
                return data
            }

            const createData = createFunc({
                descr: 'creating error handled data',
                useCache: ([props]) => [Object.assign({}, props).data],
                data: function (props) {
                    props = Object.assign({}, props)

                    const { descr, data, onCatch, useCache, refs } = props

                    if (data instanceof Date) {
                        const copy = new Date()

                        copy.setTime(data.getTime())

                        return copy
                    }

                    if (data instanceof RegExp) {
                        const regExpText = String(data)
                        const lastSlashIdx = regExpText.lastIndexOf('/')

                        return new RegExp(
                            regExpText.slice(1, lastSlashIdx),
                            regExpText.slice(lastSlashIdx + 1)
                        )
                    }

                    if (
                        !['object', 'function'].includes(typeof data) ||
                        data === null
                    ) {
                        return data
                    }

                    if (refs.has(data)) {
                        return refs.get(data)
                    }

                    const assignHandledProps = createFunc({
                        descr: 'assigning error handled properties',
                        useCache: args => args,
                        data: function (source, target) {
                            const descriptors = Object.getOwnPropertyDescriptors(source)
                            const descriptorKeys = Object
                                .getOwnPropertyNames(descriptors)
                                .concat(Object.getOwnPropertySymbols(descriptors))

                            let i = descriptorKeys.length

                            while (i--) {
                                const key = descriptorKeys[i]

                                try {
                                    let value = descriptors[key].value

                                    if (
                                        ['object', 'function'].includes(typeof value) &&
                                        value !== null
                                    ) {
                                        value = createData({
                                            // key can be a Symbol
                                            descr: `${descr}["${String(key)}"]`,
                                            data: value,
                                            onCatch: source[`${String(key)}OnCatch`],
                                            useCache: source[`${String(key)}UseCache`],
                                            refs
                                        })
                                    }

                                    Object.defineProperty(target, key, Object.assign(
                                        descriptors[key],
                                        ('value' in descriptors[key]) ? { value } : null
                                    ))
                                } catch (error) {
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

                    if (typeof data === 'function') {
                        handledData = createFunc({ descr, data, onCatch, useCache })
                    } else if (Array.isArray(data)) {
                        handledData = []
                    } else {
                        handledData = {}
                    }

                    refs.set(data, handledData)

                    assignHandledProps(data, handledData)

                    const dataProto = Object.getPrototypeOf(data)
                    let handledProto

                    if (dataProto === null || builtinPrototypes.includes(dataProto)) {
                        handledProto = dataProto
                    } else {
                        handledProto = createData({
                            descr: `${descr}["__proto__"]`,
                            data: dataProto,
                            refs
                        })
                    }

                    Object.setPrototypeOf(handledData, handledProto)

                    if (typeof data === 'function') {
                        // set descr as the name of the function
                        try {
                            Object.defineProperty(handledData, 'name', {
                                value: descr,
                                configurable: true
                            })
                        } catch (error) {
                            logError({
                                descr: `setting description as name for ${descr}`,
                                error
                            })
                        }

                        // constructor inside the prototype of a function should be
                        // the same as the function itself
                        if (
                            isObject(data.prototype) &&
                            data.prototype.constructor === data
                        ) {
                            try {
                                Object.defineProperty(
                                    handledData.prototype,
                                    'constructor',
                                    {
                                        value: handledData,
                                        writable: true,
                                        configurable: true
                                    }
                                )
                            } catch (error) {
                                logError({
                                    descr: `assigning constructor to ${descr}`,
                                    error
                                })
                            }
                        }
                    }

                    return handledData
                },
                onCatch: ({ args: [props] }) => Object.assign({}, props).data
            })

            return createData({
                descr,
                data,
                onCatch: Object.assign({}, options).onCatch,
                useCache: Object.assign({}, options).useCache,
                refs: new WeakMap()
            })
        },
        onCatch: ({ args: [descr, data] }) => typeof descr !== 'string' ? descr : data
    })

    const getHandledServer = tieUp(
        'initializing error handling for server',
        function (server) {
            if (!isNodeJS) {
                throw new Error('This function is meant for NodeJS')
            }

            server = tieUp('HTTP server', server)

            const sockets = new Set()
            const serverErrorListener = tieUp(
                'handling server closing',
                function () {
                    server.close()
                    sockets.forEach(socket => { socket.destroy() })
                }
            )

            if (isNodeJS) {
                server.on('connection', socket => {
                    sockets.add(socket)
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
        { useCache: ([server]) => [server], onCatch: ({ args: [server] }) => server }
    )

    const getRoutingCreator = tieUp(
        'creating function for routing',
        function (app, onCatch) {
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
                            error: {
                                name: 'Internal server error',
                                message: error.message,
                                stack: error.stack
                            }
                        })
                    }
                }
            }

            return tieUp(
                'creating route for the server',
                function (method, path, callback) {
                    if (
                        typeof method !== 'string' ||
                        typeof path !== 'string' ||
                        typeof callback !== 'function'
                    ) {
                        throw new Error(
                            'Invalid parameters provided, expected: ' +
                            'method(string), path(string), callback(function)'
                        )
                    }

                    app[method](path, tieUp(
                        `${method.toUpperCase()} ${path}`,
                        callback,
                        { onCatch }
                    ))
                }
            )
        },
        { onCatch: () => () => {}, useCache: args => args }
    )

    const errorListener = tieUp(
        'listening for unexpected errors',
        function (eventOrError) {
            if (isBrowser) {
                if (eventOrError instanceof Event) {
                    eventOrError.stopImmediatePropagation()
                    eventOrError.preventDefault()

                    const error = eventOrError.reason instanceof Error
                        ? eventOrError.reason
                        : eventOrError.error instanceof Error
                            ? eventOrError.error
                            : undefined

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
        FriendlyError,
        tieUp,
        getHandledServer,
        getRoutingCreator
    }
}
