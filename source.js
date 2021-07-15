module.exports = function (props) {
    'use strict'

    // - Variables -----------------------------------------------------------------------
    const checkIfObject = val =>
        typeof val === 'object' && !Array.isArray(val) && val !== null

    const isBrowser = typeof window === 'object'
    const isWorker = typeof importScripts === 'function'
    const isNodeJS = typeof process === 'object' &&
        typeof process.versions === 'object' &&
        typeof process.versions.node === 'string'

    const FriendlyError = class extends Error {
        constructor (...args) {
            super(...args)
            this.name = 'FriendlyError'
        }
    }

    const defaultLogger = checkIfObject(console) && typeof console.error === 'function'
        ? console.error
        : () => {}

    const browserEventNames = ['error', 'unhandledrejection']

    const nodeEventNames =
        ['uncaughtException', 'unhandledRejection', 'SIGTERM', 'SIGINT', 'SIGHUP']

    const alreadyHandled = new WeakSet()

    let caches = new WeakMap()

    const lastError = Object.seal({ errorDescr: '', argsInfo: '', errorMsg: '', time: 0 })

    // - Parameters ----------------------------------------------------------------------
    props = Object.assign({}, props)

    const isDevelopment = typeof props.isDevelopment === 'boolean'
        ? props.isDevelopment
        : checkIfObject(process) && checkIfObject(process.env)
            ? process.env.NODE_ENV !== 'production'
            : false

    const shouldFreezePage = typeof props.shouldFreezePage === 'boolean'
        ? props.shouldFreezePage
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
                defaultLogger('\n Issue with: parameter errorLogger\n', error, '\n')
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
            errorLogger('\n Issue with: parameter notify\n', error, '\n')
        }
    }

    // - Functions -------------------------------------------------------------
    const logError = function (props) {
        try {
            props = Object.assign({}, props)

            const isUncaught = typeof props.isUncaught === 'boolean'
                ? props.isUncaught
                : false

            const errorDescr = (function () {
                let descr = 'Issue with: '

                if (typeof props.descr === 'string') {
                    descr += props.descr
                } else if (isUncaught) {
                    descr += 'unhandled error'
                } else {
                    descr += 'a part of the app'
                }

                return descr
            })()

            const error = props.error instanceof Error
                ? props.error
                : isUncaught ? new Error('Uncaught error') : new Error('Unknown error')

            const argsInfo = (function () {
                if (!Array.isArray(props.args)) {
                    return ''
                }

                let [result, i] = ['', -1]

                while (props.args.length - (++i)) {
                    let arg = props.args[i]

                    if (arg !== null && ['object', 'function'].includes(typeof arg)) {
                        arg = Array.isArray(arg) ? '[array]' : `[${typeof arg}]`
                    } else if (typeof arg === 'string') {
                        arg = `"${arg}"`
                    }

                    result += i === 0 ? arg : ` , ${arg}`
                }

                return result.length > 100
                    ? result.slice(0, 100) + '...'
                    : result
            })()

            const isFriendlyError = error instanceof FriendlyError

            const prodInfo = {
                errorDescription: errorDescr,
                arguments: argsInfo,
                date: (new Date()).toUTCString(),
                error
            }

            if (isBrowser || isWorker) {
                Object.assign(prodInfo, {
                    localUrl: self.location.href,
                    browserInfo: self.navigator.userAgent,
                    osType: self.navigator.platform
                })
            }

            if (isNodeJS) {
                Object.assign(prodInfo, {
                    localUrl: process.cwd(),
                    cpuArch: process.arch,
                    osType: process.platform,
                    depVersions: process.versions
                })
            }

            // prevent immedeately repeating errors
            const curTime = Date.now()

            if (
                lastError.errorDescr !== errorDescr ||
                lastError.argsInfo !== argsInfo ||
                lastError.errorMsg !== error.message ||
                (curTime - lastError.time) > 1000
            ) {
                errorLogger(
                    `\n ${errorDescr}\n`,
                    `Function arguments: ${argsInfo}\n`,
                    error, '\n'
                )

                notify({
                    isFriendlyError,
                    isDevelopment,
                    isUncaught,
                    prodInfo,
                    error,
                    errorDescr
                })
            }

            Object.assign(lastError, {
                errorDescr,
                argsInfo,
                errorMsg: error.message,
                time: curTime
            })
        } catch (error) {
            errorLogger('\n Issue with: logging errors\n', error, '\n')
        }
    }

    const createFunc = function (descr, func, options) {
        try {
            options = Object.assign({}, options)

            // TODO: add 'types = []' and validate them
            const { onError = () => {}, useCache } = options

            if (typeof descr !== 'string') {
                throw new TypeError(`${descr} - First arg must be a string`)
            }

            if (typeof func !== 'function') {
                throw new TypeError(`"${descr}" must be a function`)
            }

            if (typeof onError !== 'function') {
                throw new TypeError(`${descr} - onError must be a function`)
            }

            if (useCache !== undefined && typeof useCache !== 'function') {
                throw new TypeError(`${descr} - useCache must be a function`)
            }

            // TODO
            // if (!Array.isArray(types)) {
            //     throw new TypeError(`${descr} - types must be an array`)
            // }

            if (alreadyHandled.has(func)) {
                return func
            }

            let unfinishedCalls = 0

            const innerCatch = function ({ error, args }) {
                if (unfinishedCalls > 1) {
                    throw error
                }

                logError({ descr, error, args })

                try {
                    return onError({ descr, args, error })
                } catch (error) {
                    logError({
                        descr: `catching errors for ${descr}`,
                        args,
                        error
                    })
                }
            }

            const innerFunc = function (...args) {
                try {
                    unfinishedCalls++

                    let result, cacheItem, cacheArgs, storageKey, i

                    // retrieve result from cache
                    if (typeof useCache === 'function') {
                        try {
                            cacheArgs = useCache(args)
                        } catch (error) {
                            logError({
                                descr: `creating a cache key for ${descr}`,
                                args,
                                error
                            })
                        }

                        if (Array.isArray(cacheArgs)) {
                            if (!caches.has(innerFunc)) {
                                caches.set(innerFunc, {})
                            }

                            cacheArgs = [this].concat(cacheArgs)
                            cacheItem = caches.get(innerFunc)
                            i = -1

                            while (cacheArgs.length - (++i)) {
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
                            }

                            if (i === cacheArgs.length && 'result' in cacheItem) {
                                return cacheItem.result
                            }

                            // save on loop time
                            cacheArgs.splice(0, i)
                        }
                    }

                    // regular function call
                    if (new.target === undefined) {
                        result = func.apply(this, args)
                    // creating an object with constructor
                    } else {
                        result = (function (Constr) {
                            return Object.create(
                                innerFunc.prototype,
                                Object.getOwnPropertyDescriptors(new Constr(...args))
                            )
                        })(func)
                    }

                    // handle async, generator and async generator
                    if (checkIfObject(result)) {
                        // the function returns an async iterator
                        if (typeof result[Symbol.asyncIterator] === 'function') {
                            result = (async function * (iter) {
                                try {
                                    return yield * iter
                                } catch (error) {
                                    return innerCatch({ error, args })
                                }
                            })(result)
                        // the function returns an iterator
                        } else if (typeof result[Symbol.iterator] === 'function') {
                            result = (function * (iter) {
                                try {
                                    return yield * iter
                                } catch (error) {
                                    return innerCatch({ error, args })
                                }
                            })(result)
                        // the function returns a promise
                        } else if (
                            typeof result.then === 'function' &&
                            typeof result.catch === 'function'
                        ) {
                            result = (async function (prom) {
                                try {
                                    return await prom
                                } catch (error) {
                                    return innerCatch({ error, args })
                                }
                            })(result)
                        }
                    }

                    // save the result in cache
                    if (Array.isArray(cacheArgs)) {
                        i = -1

                        while (cacheArgs.length - (++i)) {
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

            alreadyHandled.add(innerFunc)

            return innerFunc
        } catch (error) {
            logError({
                descr: 'creating error-handled function',
                error,
                args: [descr, func, options]
            })

            return () => {}
        }
    }

    const parseArgTypes = createFunc(
        'parsing argTypes string to array',
        function ({ descr, argTypes = '' }) {
            if (typeof argTypes !== 'string') {
                throw new TypeError(`${descr} - argTypes must be a string`)
            }

            argTypes = argTypes.replace(/\n|\t|\r/g, '')

            const keyReg = /^\s*:.+:\s*/
            const simpleTypeReg = new RegExp(
                '^\\s*(:([^:]+):\\s*)?(\\{\\s*\\}|\\[\\s*\\]|\\(\\s*\\)|' +
                '@?\\w+\\s*(=\\s*\\d+|>\\s*\\d+|>=\\s*\\d+)?\\s*' +
                '(<\\s*\\d+|<=\\s*\\d+)?)\\s*'
            )
            const openSymReg = /^\s*(:([^:]+):\s*)?(\{|\[|\()\s*/
            const closeSymReg = /^\s*(\}|\]|\))\s*/
            const endReg = /^(\}|\]|\)|\||,|$)/
            const reg1 = /^(null|undef|bool)\w*$/
            const reg2 = /^@(\w+)$/
            const reg3 = /^(str|num|int)\w*(=\d+|>\d+|>=\d+)?(<\d+|<=\d+)?$/
            const reg4 = /^(\{\}|\[\]|\(\))$/
            const closeSymDict = { '{': '}', '[': ']', '(': ')' }
            const parsedTypes = [[]]
            const pathToStore = [0]
            const openSymHistory = []

            while (argTypes.length) {
                const currStore = (function () {
                    let [acc, i] = [parsedTypes, -1]

                    while (pathToStore.length - (++i)) {
                        acc = acc[pathToStore[i]]
                    }

                    return acc
                })()

                if (simpleTypeReg.test(argTypes)) {
                    const workingPart = simpleTypeReg.exec(argTypes)[0]
                    const objKey = keyReg.test(workingPart)
                        ? workingPart.replace(simpleTypeReg, '$2')
                        : ''
                    const typeDescr = workingPart.replace(simpleTypeReg, '$3')
                        .replace(/\s+/g, '')

                    let parsedType

                    // parse typeDescr to type object
                    if (reg1.test(typeDescr)) {
                        parsedType = { type: typeDescr.replace(reg1, '$1') }
                    } else if (reg2.test(typeDescr)) {
                        parsedType = { inst: typeDescr.replace(reg2, '$1') }
                    } else if (reg3.test(typeDescr)) {
                        parsedType = JSON.parse(typeDescr.replace(reg3, `{
                            "type": "$1",
                            "eqs": ["$2", "$3"]
                        }`))
                        parsedType.eqs = parsedType.eqs.filter(eq => eq.length > 0)
                    } else if (reg4.test(typeDescr)) {
                        parsedType = { type: typeDescr[0] }
                    } else {
                        throw new Error(`${typeDescr} is invalid simple type`)
                    }

                    // remove the already parsed part
                    argTypes = argTypes.replace(simpleTypeReg, '')

                    // must have an ending symbol
                    if (!endReg.test(argTypes)) {
                        throw new Error('Missing ending symbol in argTypes')
                    }

                    const endSym = argTypes[0]

                    // save parsedType and modify parsedTypes, pathToStore
                    if (objKey === '') {
                        currStore.push(parsedType)

                        if (endSym === ',') {
                            if (pathToStore.length === 1) {
                                parsedTypes.push([])
                                pathToStore[0]++
                            } else {
                                pathToStore.pop()
                            }
                        }
                    } else {
                        currStore[objKey] = [parsedType]

                        if (endSym === '|') {
                            pathToStore.push(objKey)
                        }
                    }

                    // remove seperating symbol
                    if (/\||,/.test(endSym)) {
                        argTypes = argTypes.slice(1)
                    }
                } else if (openSymReg.test(argTypes)) {
                    const workingPart = openSymReg.exec(argTypes)[0]
                    const objKey = keyReg.test(workingPart)
                        ? workingPart.replace(openSymReg, '$2')
                        : ''
                    const openSym = workingPart.replace(openSymReg, '$3')
                    const parsedType = { type: openSym, props: {} }

                    // remove the already parsed part
                    argTypes = argTypes.replace(openSymReg, '')

                    // save parsedType and modify parsedTypes, pathToStore
                    if (objKey === '') {
                        currStore.push(parsedType)
                        pathToStore.push(currStore.length - 1, 'props')
                    } else {
                        currStore[objKey] = [parsedType]
                        pathToStore.push(objKey, 0, 'props')
                    }

                    // add an opening symbol to history
                    openSymHistory.push(openSym)
                } else if (closeSymReg.test(argTypes)) {
                    const workingPart = closeSymReg.exec(argTypes)[0]
                    const closeSym = workingPart.replace(closeSymReg, '$1')
                    const lastOpenSym = openSymHistory[openSymHistory.length - 1]

                    // last open symbol has to match current close symbol
                    if (closeSymDict[lastOpenSym] !== closeSym) {
                        throw new Error(
                            'There is a mismatch between opening and closing symbols'
                        )
                    }

                    // remove the already parsed part
                    argTypes = argTypes.replace(closeSymReg, '')

                    // must have an ending symbol
                    if (!endReg.test(argTypes)) {
                        throw new Error('Missing ending symbol in argTypes')
                    }

                    const endSym = argTypes[0]

                    // modify parsedTypes, pathToStore
                    pathToStore.pop()
                    pathToStore.pop()

                    if (endSym !== '|') {
                        if (pathToStore.length === 1) {
                            parsedTypes.push([])
                            pathToStore[0]++
                        } else {
                            pathToStore.pop()
                        }
                    }

                    // remove seperating symbol
                    if (/\||,/.test(endSym)) {
                        argTypes = argTypes.slice(1)
                    }

                    // open symbols history must not be empty
                    if (openSymHistory.length < 1) {
                        throw new Error('There are more closing symbols than opening')
                    }

                    // remove last opened sym, already handled
                    openSymHistory.pop()
                } else {
                    throw new Error('Argument argTypes has incorrect format')
                }
            }

            // every opening {|[|( must be closed
            if (openSymHistory.length > 0) {
                throw new Error('There are more opening symbols than closing')
            }

            // handle dangling comma
            if (parsedTypes[parsedTypes.length - 1].length === 0) {
                parsedTypes.pop()
            }

            return parsedTypes
        },
        { onError: () => ([]) }
    )

    const assignHandledProps = createFunc(
        'assigning error-handled properties',
        function (props) {
            props = Object.assign({}, props)

            const { source, target, descr, refs } = props
            const descriptors = Object.getOwnPropertyDescriptors(source)
            const descriptorKeys = Object
                .getOwnPropertyNames(descriptors)
                .concat(Object.getOwnPropertySymbols(descriptors))

            let i = -1

            while (descriptorKeys.length - (++i)) {
                const key = descriptorKeys[i]

                try {
                    let value = descriptors[key].value

                    if (
                        value !== null &&
                        ['object', 'function'].includes(typeof value) &&
                        !String(key).match(/.+(OnError|UseCache)$/)
                    ) {
                        const keyDescr = `${descr}["${String(key)}"]`
                        const argTypes = source[`${String(key)}ArgTypes`]
                        const types = parseArgTypes({ descr: keyDescr, argTypes })

                        value = cloneData({
                            // key can be a Symbol
                            descr: keyDescr,
                            data: value,
                            refs,
                            options: {
                                onError: source[`${String(key)}OnError`],
                                useCache: source[`${String(key)}UseCache`],
                                types
                            }
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
    )

    const cloneData = createFunc(
        'cloning data error-handled',
        function (props) {
            props = Object.assign({}, props)

            const { descr, data, refs, options } = props

            if (
                data === null ||
                !['object', 'function'].includes(typeof data)
            ) {
                return data
            }

            if (refs.has(data)) {
                return refs.get(data)
            }

            let handledData

            if (typeof data === 'function') {
                handledData = createFunc(descr, data, options)
            } else if (data instanceof RegExp) {
                const regExpText = String(data)
                const lastSlashIdx = regExpText.lastIndexOf('/')

                handledData = new RegExp(
                    regExpText.slice(1, lastSlashIdx),
                    regExpText.slice(lastSlashIdx + 1)
                )
            } else if (data instanceof Date) {
                handledData = new Date(data.getTime())
            } else if (Array.isArray(data)) {
                handledData = []
            } else {
                handledData = {}
            }

            refs.set(data, handledData)

            assignHandledProps({ source: data, target: handledData, descr, refs })

            Object.setPrototypeOf(handledData, Object.getPrototypeOf(data))

            return handledData
        },
        { onError: ({ args: [props] }) => Object.assign({}, props).data }
    )

    const tieUp = createFunc(
        'tying up data',
        function (descr, data, options) {
            if (data === null || !['object', 'function'].includes(typeof data)) {
                return data
            }

            options = Object.assign({}, options)
            options.types = parseArgTypes({
                descr,
                argTypes: options.argTypes
            })

            const handledData = cloneData({
                descr,
                data,
                options,
                refs: new WeakMap()
            })

            // set descr as the name of the function
            if (typeof handledData === 'function') {
                Object.defineProperty(handledData, 'name', {
                    value: descr,
                    configurable: true
                })
            }

            return handledData
        },
        { onError: ({ args: [_, data] }) => data }
    )

    const tieUpPartial = tieUp(
        'tying up a partial function',
        function (descr, func, options) {
            options = Object.assign({}, options)

            const {
                onErrorOuter = () => () => {},
                useCacheOuter,
                argTypesOuter,
                onError = () => {},
                useCache,
                argTypes
            } = Object.assign({}, options)

            const handledPartialFunc = tieUp(
                `partially ${descr}`,
                function (...args) {
                    const appliedFunc = func.apply(this, args)

                    if (typeof appliedFunc !== 'function') {
                        throw new Error(
                            'Partial function should return a function, ' +
                            'instead received ' + typeof appliedFunc
                        )
                    }

                    return tieUp(
                        descr,
                        appliedFunc,
                        { useCache, onError, argTypes }
                    )
                },
                {
                    argTypes: argTypesOuter,
                    useCache: useCacheOuter,
                    onError: onErrorOuter
                }
            )

            return handledPartialFunc
        },
        { onError: () => () => () => {} }
    )

    const clearCache = tieUp(
        'clearing the cache for a tied up function',
        function (tiedFunc) {
            if (typeof tiedFunc === 'function' && caches.has(tiedFunc)) {
                caches.delete(tiedFunc)
            }
        }
    )

    const clearAllCaches = tieUp(
        'clearing all the caches',
        function () { caches = new WeakMap() }
    )

    const getHandledServer = tieUp(
        'initializing error handling for server',
        function (server, sockets) {
            if (!isNodeJS) {
                throw new Error('This function is meant for NodeJS')
            }

            sockets = sockets instanceof Set
                ? sockets
                : new Set()

            server.on('connection', tieUp(
                'adding sockets to server',
                function (socket) {
                    sockets.add(socket)
                    socket.on('close', () => { sockets.delete(socket) })
                }
            ))

            let i = -1

            while (nodeEventNames.length - (++i)) {
                process.prependListener(nodeEventNames[i], tieUp(
                    'handling server closing',
                    function () {
                        server.close()
                        sockets.forEach(socket => { socket.destroy() })
                    }
                ))
            }

            return server
        },
        {
            useCache: ([server]) => [server],
            onError: ({ args: [server] }) => server
        }
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
                    'app(function|object), onError(undefined|function)'
                )
            }

            if (onError === undefined) {
                onError = function ({ args: [_, res], error }) {
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

    const uncaughtErrorListener = tieUp(
        'listening for uncaught errors',
        function (eventOrError) {
            if (isBrowser || isWorker) {
                let error

                if (eventOrError instanceof Event) {
                    eventOrError.stopImmediatePropagation()
                    eventOrError.preventDefault()

                    error = eventOrError.reason instanceof Error
                        ? eventOrError.reason
                        : eventOrError.error instanceof Error
                            ? eventOrError.error
                            : undefined
                }

                logError({ isUncaught: true, error })

                // prevent user from interacting with the page
                if (isBrowser && shouldFreezePage) {
                    window.document.body.style['pointer-events'] = 'none'
                }
            }

            if (isNodeJS) {
                let exitCode = 0

                if (eventOrError instanceof Error) {
                    exitCode = 1

                    logError({ isUncaught: true, error: eventOrError })
                }

                global.setTimeout(() => { process.exit(exitCode) }, 500).unref()
            }
        }
    )

    if ((isBrowser || isWorker) && !self.tp_areUnhandledCaught) {
        let i = -1

        while (browserEventNames.length - (++i)) {
            self.addEventListener(browserEventNames[i], uncaughtErrorListener, true)
        }

        Object.defineProperty(
            self,
            'tp_areUnhandledCaught',
            { value: true, configurable: true }
        )
    }

    if (isNodeJS && !global.tp_areUnhandledCaught) {
        let i = -1

        while (nodeEventNames.length - (++i)) {
            process.on(nodeEventNames[i], uncaughtErrorListener)
        }

        Object.defineProperty(
            global,
            'tp_areUnhandledCaught',
            { value: true, configurable: true }
        )
    }

    return {
        isDevelopment,
        errorLogger,
        notify,
        FriendlyError,
        tieUp,
        tieUpPartial,
        clearAllCaches,
        clearCache,
        getHandledServer,
        getRoutingCreator
    }
}
