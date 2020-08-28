# pure-error-handling
Utilities for error handling

## Examples
```js
const getErrorHandlers = require('pure-error-handling')
const {
    isBrowser,
    isNodeJS,
    stringifyAll,
    loggingService,
    createFunc,
    createMethods,
    getWrapApp,
    initUncaughtErrorHandling
} = getErrorHandlers({ isProduction, notifyUser, loggingService })

if (isBrowser) {
    initUncaughtErrorHandling()
}

if (isNodeJS) {
    // Use `nodemon` for restarting on change
    // Usef `forever` for restarting on crash
    const http = require('http')
    const express = require('express')
    const app = express()
    const wrapApp = getWrapApp(app)

    wrapApp('use', '/', express.urlencoded({ extended: true }))
    wrapApp('use', '/', express.json())
    wrapApp('use', '/', (req, res, next) => {
        res.set('Access-Control-Allow-Origin', '*')
        res.set(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept'
        )
        next()
    })

    wrapApp('get', '/', (req, res, next) => {
        res.send('Hello World!')

        throw new Error('whoops')
    })

    wrapApp('get', '/err', async (req, res, next) => {
        await new Promise(resolve => setTimeout(resolve, 1000))

        throw new Error('Async whoops')
    })

    app.get('/uncaught', async (req, res, next) => {
        throw new Error('Is uncaught error')
    })

    wrapApp('all', '*', (req, res, next) => {
        res.status(404).json({ message: 'Page not found' })
    })

    const server = http.createServer(app)
    const port = process.env.PORT || 8080

    initUncaughtErrorHandling(server)
    server.listen(port, function(err) {
        if (err) throw err
        console.log(`Server running at http://localhost:${port}`)
    })
}

const printNum = createFunc(
    'Printing a number',
    num => {
        blabla
        return num
    },
    num => {
        console.log(`Ran inside catch - the argument was ${num}`)
        return 0
    }
)

const measureFib = createFunc(
    'Measuring time for fibonacci number',
    num => {
        const fib = n => {
            if (n < 0 || Math.trunc(n) !== n)
                throw new Error('num had to be positive integer')

            return n <= 1 ? n : fib(n-1) + fib(n-2)
        }

        const startTime = Date.now()

        try {
            return fib(num)
        } finally {
            console.log(`execution time ${Date.now() - startTime}ms`)
        }
    },
    () => 'Incorrect fibonacchi calculation'
)

const delayReturn = createFunc(
    'Delaying async function',
    async (ms) => {
        await new Promise(resolve => setTimeout(resolve, ms))

        if (typeof ms === 'number')
            return 'Proper result'
        else
            throw new Error('Async error from promise')
    },
    () => 'Default result'
)

const undefinedFunc = createFunc()

console.log('undefinedFunc(31)', undefinedFunc(31))
console.log('printNum(9)', printNum(9))
delayReturn(10).then(val => console.log('delayReturn(10) ' + val))
console.log('measureFib(35)', measureFib(35))
console.log(
    'measureFib({ a: [ 2, 5, { b: { c: 123 } } ] }, -32.55)',
    measureFib({ a: [ 2, 5, { b: { c: 123 } } ] }, -32.55)
)
console.log('measureFib(-12)', measureFib(-12))
console.log('\nThe program continues...')
delayReturn('invalid ms').then(val => console.log('delayReturn("invalid ms")', val))
//new Promise(() => { uncaughtAsyncFunc() })
//setTimeout(() => { uncaughtSyncFunc() }, 500)
```
