module.exports = (props) => {
    'use strict'

    // - Constants -------------------------------------------------------------
    const checkIfObject = val =>
        typeof val === 'object' && !Array.isArray(val) && val !== null

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

    const defaultLogger = checkIfObject(console) && typeof console.error === 'function'
        ? console.error
        : () => {}

    const defaultDescr = 'part of the app'

    const browserEventNames = ['error', 'unhandledrejection']

    const nodeEventNames =
        ['uncaughtException', 'unhandledRejection', 'SIGTERM', 'SIGINT']

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

    const alreadyHandled = new WeakSet()

    const caches = new WeakMap()

    // - Parameters ------------------------------------------------------------
    props = Object.assign({}, props)

    const isDevelopment = typeof props.isDevelopment === 'boolean'
        ? props.isDevelopment
        : checkIfObject(process) && checkIfObject(process.env)
            ? process.env.NODE_ENV !== 'production'
            : false

    const errorLoggerUnhandled = typeof props.errorLogger === 'function'
        ? props.errorLogger
        : defaultLogger

    const errorLogger = function (...args) {
        try {
            if (isDevelopment) {
                errorLoggerUnhandled.apply(this, args)
            }
        } catch (error) {
            if (isDevelopment) {
                defaultLogger(' Issue with: parameter errorLogger\n', error)
            }
        }
    }

    const notifyUnhandled = typeof props.notify === 'function'
        ? props.notify
        : () => {}

    const notify = function (...args) {
        try {
            notifyUnhandled.apply(this, args)
        } catch (error) {
            errorLogger(' Issue with: parameter notify\n', error)
        }
    }

    // - Functions -------------------------------------------------------------
    const logError = function (props) {
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

            errorLogger(
                '\n',
                'Issue with:', descr, '\n',
                'Function arguments:', args, '\n',
                error, '\n'
            )

            notify({
                isDevelopment,
                isUncaught,
                isFriendly,
                userMsg,
                productionInfo,
                error
            })
        } catch (error) {
            errorLogger(' Issue with: error logger\n', error, '\n')
        }
    }

    const createFunc = function (props) {
        try {
            props = Object.assign({}, props)

            const { descr, useCache } = props

            const data = typeof props.data === 'function'
                ? props.data
                : () => {}

            const onError = typeof props.onError === 'function'
                ? createFunc({
                    descr: `catching errors for ${descr}`,
                    data: props.onError
                })
                : () => {}

            let unfinishedCalls = 0

            const innerCatch = function ({ error, args }) {
                if (unfinishedCalls > 1) {
                    throw error
                }

                logError({ descr, error, args })

                return onError(args, error)
            }

            return function innerFunc (...args) {
                try {
                    unfinishedCalls++

                    let result, cacheItem, cacheArgs, storageKey, i

                    // retrieve result from cache
                    if (typeof useCache === 'function') {
                        cacheArgs = useCache(args)

                        if (Array.isArray(cacheArgs)) {
                            if (!caches.has(innerFunc)) {
                                caches.set(innerFunc, {})
                            }

                            cacheArgs = [this].concat(cacheArgs)
                            cacheItem = caches.get(innerFunc)
                            i = 0

                            while (i < cacheArgs.length) {
                                storageKey =
                                    cacheArgs[i] !== null &&
                                    ['object', 'function'].includes(typeof cacheArgs[i])
                                        ? 'references'
                                        : 'primitives'

                                if (
                                    storageKey in cacheItem &&
                                    cacheItem[storageKey].has(cacheArgs[i])
                                ) {
                                    cacheItem = cacheItem[storageKey]
                                        .get(cacheArgs[i])
                                } else {
                                    break
                                }

                                i++
                            }

                            if (i === cacheArgs.length && 'result' in cacheItem) {
                                return cacheItem.result
                            }

                            // save on loop time
                            cacheArgs.splice(0, i)
                        }
                    }

                    // calculating result
                    if (new.target === undefined) {
                        result = data.apply(this, args)
                    } else {
                        result = (function () {
                            const obj = new data(...args)

                            if (checkIfObject(innerFunc.prototype)) {
                                Object.setPrototypeOf(obj, innerFunc.prototype)
                            }

                            return obj
                        })()
                    }

                    // if the function returns a promise
                    if (
                        checkIfObject(result) &&
                        typeof result.then === 'function' &&
                        typeof result.catch === 'function'
                    ) {
                        result = result.catch(error => innerCatch({ error, args }))
                    }

                    // save the result in cache
                    if (Array.isArray(cacheArgs)) {
                        i = 0

                        while (i < cacheArgs.length) {
                            storageKey =
                                cacheArgs[i] !== null &&
                                ['object', 'function'].includes(typeof cacheArgs[i])
                                    ? 'references'
                                    : 'primitives'

                            if (!(storageKey in cacheItem)) {
                                cacheItem[storageKey] = storageKey === 'references'
                                    ? new WeakMap()
                                    : new Map()
                            }

                            cacheItem = cacheItem[storageKey].has(cacheArgs[i])
                                ? cacheItem[storageKey].get(cacheArgs[i])
                                : cacheItem[storageKey].set(cacheArgs[i], {})
                                    .get(cacheArgs[i])

                            i++
                        }

                        cacheItem.result = result
                    }

                    return result
                } catch (error) {
                    return innerCatch({ error, args })
                } finally {
                    unfinishedCalls--
                }
            }
        } catch (error) {
            logError({ descr: 'error handling functions', error, args: [props] })

            return () => {}
        }
    }

    const assignHandledProps = createFunc({
        descr: 'assigning error handled properties',
        data: function (props) {
            props = Object.assign({}, props)

            const { source, target, descr, refs } = props
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
                        value !== null &&
                        !String(key).match(/.+(OnError|UseCache)$/)
                    ) {
                        value = createData({
                            // key can be a Symbol
                            descr: `${descr}["${String(key)}"]`,
                            data: value,
                            onError: source[`${String(key)}OnError`],
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
                        descr: `assigning method ${String(key)} to ${descr}`,
                        error,
                        args: [source, target]
                    })
                }
            }
        }
    })

    const createData = createFunc({
        descr: 'creating error handled data',
        data: function (props) {
            props = Object.assign({}, props)

            const { descr, data, onError, useCache, refs } = props

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
                data === null ||
                alreadyHandled.has(data)
            ) {
                return data
            }

            if (refs.has(data)) {
                return refs.get(data)
            }

            let handledData

            if (typeof data === 'function') {
                handledData = createFunc({ descr, data, onError, useCache })
            } else if (Array.isArray(data)) {
                handledData = []
            } else {
                handledData = {}
            }

            refs.set(data, handledData)

            assignHandledProps({ source: data, target: handledData, descr, refs })

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
                if (!descr.includes(defaultDescr)) {
                    Object.defineProperty(handledData, 'name', {
                        value: descr,
                        configurable: true
                    })
                }

                // constructor inside the prototype of a function should be
                // the same as the function itself
                if (
                    checkIfObject(data.prototype) &&
                    data.prototype.constructor === data
                ) {
                    Object.defineProperty(
                        handledData.prototype,
                        'constructor',
                        {
                            value: handledData,
                            writable: true,
                            configurable: true
                        }
                    )
                }
            }

            alreadyHandled.add(handledData)

            return handledData
        },
        onError: ([props]) => Object.assign({}, props).data
    })

    const tieUp = createFunc({
        descr: 'tying up data with error handling',
        data: function (descr, data, options) {
            if (typeof descr !== 'string') {
                descr = defaultDescr
                data = arguments[0]
                options = arguments[1]
            }

            if (!['object', 'function'].includes(typeof data) || data === null) {
                return data
            }

            return createData({
                descr: `[${descr}]`,
                data,
                onError: Object.assign({}, options).onError,
                useCache: Object.assign({}, options).useCache,
                refs: new WeakMap()
            })
        },
        onError: ([descr, data]) => typeof descr !== 'string' ? descr : data
    })

    const clearCache = tieUp(
        'clearing the cache for a tied up function',
        function (tiedFunc) {
            if (typeof tiedFunc === 'function' && caches.has(tiedFunc)) {
                caches.delete(tiedFunc)
            }
        }
    )

    const getHandledServer = tieUp(
        'initializing error handling for server',
        function (server, sockets) {
            if (!isNodeJS) {
                throw new Error('This function is meant for NodeJS')
            }

            server = tieUp('HTTP server', server)

            sockets = sockets instanceof Set
                ? sockets
                : new Set()

            server.on('connection', socket => {
                sockets.add(socket)
                socket.on('close', () => { sockets.delete(socket) })
            })

            let i = nodeEventNames.length

            while (i--) {
                process.prependListener(nodeEventNames[i], tieUp(
                    'handling server closing',
                    () => {
                        server.close()
                        sockets.forEach(socket => { socket.destroy() })
                    }
                ))
            }

            return server
        },
        { useCache: ([server]) => [server], onError: ([server]) => server }
    )

    const getRoutingCreator = tieUp(
        'creating function for routing',
        function (app, onError) {
            if (!isNodeJS) {
                throw new Error('This function is meant for NodeJS')
            }

            if (
                app === null ||
                !['object', 'function'].includes(typeof app) ||
                !['undefined', 'function'].includes(typeof onError)
            ) {
                throw new Error(
                    'Invalid parameters, expected: ' +
                    'app(function/object), onError(undefined/function)'
                )
            }

            if (onError === undefined) {
                onError = function ([_req, res], error) {
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
                        { onError }
                    ))
                }
            )
        },
        { onError: () => () => {}, useCache: ([app]) => [app] }
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
        errorLogger,
        notify,
        FriendlyError,
        tieUp,
        clearCache,
        getHandledServer,
        getRoutingCreator
    }
}
