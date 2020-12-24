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

            const isPure = descr.match(/\bcached\b/i) !== null

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
                let result

                if (isPure) {
                    try {
                        for (let i = 0; i < cacheKeys.length; i++) {
                            const cacheKey = cacheKeys[i]

                            if (
                                cacheKey[0] !== this ||
                                cacheKey.length !== args.length + 1
                            ) {
                                continue
                            }

                            let areEqual = true

                            // cacheKey[0] is not an argument
                            for (let m = 1; m < cacheKey.length; m++) {
                                if (!Object.is(cacheKey[m], args[m - 1])) {
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
                        result = new onTry(...args)
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
                        const cacheLimit = typeof innerFunc.tp_cacheLimit === 'number' ?
                            innerFunc.tp_cacheLimit :
                            1e5

                        if (cacheKeys.length >= cacheLimit) {
                            cacheKeys.shift()
                            cacheValues.shift()
                        }

                        cacheKeys.push([this].concat(args))
                        cacheValues.push(result)
                    } catch(e) {
                        logError({ descr: 'assigning result to cache', error, args })
                    }
                }

                return result
            }

            if (isPure) {
                Object.defineProperties(innerFunc, {
                    tp_cacheLimit: { configurable: true, value: 1e5 },
                    tp_cacheKeys: { configurable: true, value: cacheKeys },
                    tp_cacheValues: { configurable: true, value: cacheValues }
                })
            }

            return innerFunc
            // switch (onTry.constructor) {
            //     case GeneratorFunction: {
            //         // innerFunc.prototype.constructor = GeneratorFunction

            //         // return innerFunc
            //         return function * (...args) {
            //             return innerFunc.apply(this, args)
            //         }
            //     }
            //     case AsyncFunction: {
            //         return async function (...args) {
            //             return innerFunc.apply(this, args)
            //         }
            //     }
            //     case AsyncGeneratorFunction: {
            //         return async function * (...args) {
            //             return innerFunc.apply(this, args)
            //         }
            //     }
            //     default:
            //         return innerFunc
            // }

        } catch(error) {
            logError({ descr: 'error handling functions', error, args: [props] })

            return () => {}
        }
    }

    const createData = createFunc({
        descr: 'recursively creating error handled data',
        onTry: function(props) {
            props = isObject(props) ? props : {}

            const descr = typeof props.descr === 'string' ?
                props.descr :
                defaultDescr

            const data = props.data

            const onCatch = typeof props.onCatch === 'function' ?
                props.onCatch :
                () => {}

            const refs = props.refs instanceof WeakMap ?
                props.refs :
                new WeakMap()

            if (
                !['object', 'function'].includes(typeof data) ||
                data instanceof RegExp ||
                data instanceof Date ||
                data === null ||
                data.tp_isHandled
            ) {
                return data
            }

            if (refs.has(data)) {
                return refs.get(data)
            }

            const assignHandledProps = createFunc({
                descr: 'assigning error handled properties',
                onTry: function(source, target) {
                    const descriptors = Object.getOwnPropertyDescriptors(source)
                    const descriptorKeys = Object.getOwnPropertyNames(descriptors)
                        .concat(Object.getOwnPropertySymbols(descriptors))

                    for (let i = 0; i < descriptorKeys.length; i++) {
                        const key = descriptorKeys[i]

                        // if target has the prop and is not configurable
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
                                    onCatch,
                                    refs
                                })

                                // assign handled methods from prototype
                                // back to the source
                                // if (
                                //     key === 'prototype' &&
                                //     value.constructor === source
                                // ) {
                                //     assignHandledProps(value, )
                                // }
                            }

                            Object.defineProperty(target, key, Object.assign(
                                descriptors[key],
                                ('value' in descriptors[key]) ? { value } : null
                            ))
                        } catch(error) {
                            logError({
                                // key can be a Symbol
                                descr: `assigning handled ${data}["${String(key)}"]`,
                                error,
                                args: [source, target]
                            })
                        }
                    }
                }
            })

            let handledData

            if (typeof data === 'function') {
                handledData = createFunc({ descr, onTry: data, onCatch })
            } else if (Array.isArray(data)) {
                handledData = []
            } else {
                handledData = {}
            }

            refs.set(data, handledData)

            assignHandledProps(data, handledData)

            Object.defineProperties(handledData, {
                tp_isHandled: { value: true },
                tp_description: { value: descr }
            })

            const dataProto = Object.getPrototypeOf(data)
            let handledProto

            if (dataProto === null || builtinPrototypes.includes(dataProto)) {
                handledProto = dataProto
            } else {
                handledProto = createData({
                    descr: `prototype of ( ${descr} )`,
                    data: dataProto,
                    onCatch,
                    refs
                })
            }

            if (typeof data === 'function') {
                // handle errors in classes methods
                // console.log(typeof data.prototype, data.prototype)
                if (typeof data.prototype === 'object') {
                    // assignHandledProps(handledData.prototype, data.prototype)
                    // console.log({
                    //     handled: handledData.prototype,
                    //     data: data.prototype
                    // })
                }

                Object.setPrototypeOf(data, handledProto)
            }

            Object.setPrototypeOf(handledData, handledProto)

            // console.log({
            //     descr,
            //     data,
            //     dataKeys: Object.getOwnPropertyNames(data),
            //     handledData,
            //     handledDataKeys: Object.getOwnPropertyNames(handledData)
            // })
            // const [a, b, c] = [
            //     dataProto,
            //     Object.getPrototypeOf(handledData),
            //     handledProto
            // ]

            // if (
            //     !builtinPrototypes.includes(a) ||
            //     !builtinPrototypes.includes(b) ||
            //     !builtinPrototypes.includes(c)
            // ) {
            //     if (global.tp_data !== undefined) {
            //         global.tp_data.push({ a, b })
            //     } else {
            //         global.tp_data = [{ a, b }]
            //     }
            //     // console.log({ descr, a, b, c})
            // }

            return handledData
        },
        onCatch: function ({ args: [props] }) {
            return isObject(props) ? props.data : undefined
        }
    })

    const tieUp = createFunc({
        descr: 'cached tying up data with error handling',
        onTry: function (descr, data, onCatch) {
            if (typeof descr !== 'string' && typeof onCatch !== 'function') {
                descr = defaultDescr
                data = arguments[0]
                onCatch = arguments[1]
            }

            descr = `[${typeof data}: ${descr}]`

            return createData({ descr, data, onCatch })
        },
        onCatch: function ({ args: [descr, data] }) {
            return typeof descr !== 'string' && typeof onCatch !== 'function' ?
                descr :
                data
        }
    })

    const getHandledServer = tieUp(
        'initializing error handling for server',
        function(server) {
            if (!isNodeJS) {
                throw new Error('This function is meant for NodeJS')
            }

            if (server.tp_isServerHandled) {
                return server
            }

            server = tieUp('HTTP server', server)

            const sockets = new Set()
            const serverErrorListener = tieUp(
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

                for (let i = 0; i < nodeEventNames.length; i++) {
                    const eventName = nodeEventNames[i]

                    process.prependListener(eventName, serverErrorListener)
                }
            }

            Object.defineProperty(server, 'tp_isServerHandled', { value: true })

            return server
        },
        function({ args: [server] }) { return server }
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
                            errorName: 'Internal server error',
                            errorMessage: error.message,
                            stack: error.stack
                        })
                    }
                }
            }

            return tieUp(
                'creating route for the server',
                function (method, path, onTry) {
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

                    app[method](path, tieUp(
                        `${method.toUpperCase()} ${path}`,
                        onTry,
                        onCatch
                    ))
                }
            )
        },
        function() { return () => {} }
    )

    const errorListener = tieUp(
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

    if (isBrowser && window.tp_areUnhandledCaught) {
        for (let i = 0; i < browserEventNames.length; i++) {
            window.addEventListener(browserEventNames[i], errorListener, true)
        }

        window.tp_areUnhandledCaught = true
    }

    if (isNodeJS && global.tp_areUnhandledCaught) {
        for (let i = 0; i < nodeEventNames.length; i++) {
            process.on(nodeEventNames[i], errorListener)
        }

        global.tp_areUnhandledCaught = true
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
