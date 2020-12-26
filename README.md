# Tied Pants
Error handling utilities for better user and developer experience.

In programming most errors could have been caught by developers, but they were
lazy or negligent. This is me trying (pun intended) to semi-automate the process
of catching errors so your app DOESN'T crash when it doesn't need to
and that it DOES when it should. All done with useful and friendly logging.

Be a good developer, tie your pants...

## Usage
To start using this package you need to first install locally:
`npm i tied-pants` or `pnpm i tied-pants` or `yarn add tied-pants`

## Front-end Example:
```
import tiedPants from 'tied-pants'

const { tieUp, FriendlyError } = tiedPants({
    notify: ({ isDevelopment, isUncaught, isFriendly, userMsg, productionInfo }) => {
        if (isUncaught) {
            // TODO change with ERROR notification
            alert(`ERROR - ${userMsg}`)
        }
        // TODO if app is for developers, remove isFriendly check
        else if (isFriendly) {
            // TODO change with WARNING notification
            alert(`WARNING - ${userMsg}`)
        }

        // TODO add production logger that uses productionInfo
        if (!isDevelopment) {
            // callProdLoggerService(productionInfo)
        }
    }
})

const printNum = tieUp({
    descr: 'printing a number',
    onTry: num => {
        blabla
        return num
    },
    onCatch: ({ args: [num] }) => {
        console.log(`Ran inside catch - the argument was ${num}`)
        return 0
    }
})

const fib = tieUp({
    descr: 'calculating fibonacci number',
    onTry: (n) => {
        if (n < 0 || Math.trunc(n) !== n)
            throw new FriendlyError('The passed input wasnt possitive number')

        return n <= 1 ? n : fib(n-1) + fib(n-2)
    },
    onCatch: () => 0
    getCacheKey: ({ args: [n] }) => [n]
})

const measureFib = tieUp({
    descr: 'Measuring time for fibonacci number',
    onTry: num => {
        const startTime = Date.now()

        try {
            return fib(num)
        } finally {
            console.log(`execution time ${Date.now() - startTime}ms`)
        }
    },
    onCatch: () => 'Incorrect fibonacchi calculation'
})

const delayReturn = tieUp({
    descr: 'Delaying async function',
    onTry: async (ms) => {
        await new Promise(resolve => setTimeout(resolve, ms))

        if (typeof ms === 'number')
            return 'Proper result'
        else
            throw new FriendlyError('Could not delay properly')
    },
    onCatch: () => 'Default result'
})

console.log('printNum(9)', printNum(9))
delayReturn(10).then(val => console.log('delayReturn(10) ' + val))
console.log('measureFib(35)', measureFib(35))
console.log(
    'measureFib(1600, (() => {}).bind(), { a: 5, b: 32 }, [1, 3, 6])',
    measureFib(1600, (() => {}).bind(), { a: 5, b: 32 }, [1, 3, 6])
)
console.log(
    'measureFib(1600, (() => {}).bind(), { a: 5, b: 32 }, [1, 3, 6])',
    measureFib(1600, (() => {}).bind(), { a: 5, b: 32 }, [1, 3, 6])
)
console.log('measureFib(-12)', measureFib(-12))
console.log('\nThe program continues...')
delayReturn('invalid ms').then(val => console.log('delayReturn("invalid ms")', val))
new Promise(() => { uncaughtAsyncFunc() })
setTimeout(() => { uncaughtSyncFunc() }, 500)
```

## Back-end Example:
```
const http = require('http')
const express = require('express')
const tiedPants = require('tied-pants')

const { getHandledServer, getRoutingCreator } = tiedPants()
const app = express()
const createRoute = getRoutingCreator(app)

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

createRoute('get', '/', (req, res, next) => {
    res.send('Hello World!')
    throw new Error('whoops')
})

createRoute('get', '/err', async (req, res, next) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    throw new Error('Async whoops')
})

const server = getHandledServer(http.createServer(app))
const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
```

### API for parameters passed to imported function:
* `isDevelopment`
  * type: `boolean`
  * default: `process.env.NODE_ENV !== 'production'`
  * definition: Boolean that indicates if the environment is not in prod

* `devLogger`
  * type: `devMsg` -> ?
  * default: `console.error`
  * definition: Function for logging developer errors
  * `devMsg`: ` Issue with: ${descr}\n Function arguments: ${stringOfArgs}\n`, `err`

* `notify`
  * type: `({ isDevelopment, isUncaught, isFriendly, userMsg, productionInfo, error })` -> ?
  * default: `() => {}`
  * definition: Function for notifying the user with friendly error messages
      and logging in production.
  * `isDevelopment`: Boolean that indicates if the environment is not in prod
  * `isUncaught`: Boolean that indicates whether the error was caught in catch or not
  * `isFriendly`: Boolean that indicates whether `userMsg` is for regular users or developers
  * `userMsg`: String that describes what the functionality was supposed to be doing
  * `productionInfo`: Object that consists of useful info for production logging
  * `error`: Error object that was thrown

* `cacheLimit`
  * type: `number`
  * default: `100,000`
  * definition: Max amount of entries in the cache

### API for returned values from the imported function:
* `isDevelopment`
  * type: `boolean`
  * definition: Boolean parameter that was parsed from `tiedPants`

* `devLogger`
  * type: `devMsg` -> ?
  * definition: Function parameter that was parsed from `tiedPants`

* `notify`
  * type: `({ isUncaught, isFriendly, userMsg, productionInfo })` -> ?
  * definition: Function parameter that was parsed from `tiedPants`

* `isObject`
  * type: val -> boolean
  * definition: Checks if the provided value is a true object {}

* `isBrowser`
  * type: `boolean`
  * definition: Tells if in browser environment or not

* `isNodeJS`
  * type: `boolean`
  * definition: Tells if in Node.js environment or not

* `FriendlyError`
  * type: `constructor`
  * definition: Constructor that extends `Error`. Use it in functions created
      with `tieUp` to signify that the error was thrown intentionally and that
      the message is user friendly

* `tieUp`
  * type: `({ descr, onTry, onCatch, getCacheKey })` -> `error handled data`
  * definition: Error handles every type of data that you give it
  * `descr`: String that describes the data. If it has the word `cached`, then caching is enabled.
  * `onTry`: Any data which we error handle deeply. Arrays, functions and their arguments,
      objects and their methods, etc. Returns the error handled version.
  * `onCatch`: Function which acts as default onCatch for the returned data. Accepts arguments
      `({ descr, err, args })`, where `descr` is same as above, `err`
      is the thrown Error, `args` are the arguments which were supplied to the tried function.

* `getHandledServer`
  * type: `server` -> `handledServer`
  * definition: Return a server that is error handled and closed gracefully on uncaught errors
  * `server`: Object that is the back-end server (ex: http.createServer(expressApp))

* `getRoutingCreator`
  * type: `(app, onCatch)` -> `createRoute`
  * definition: Creates a function that can be used with different server frameworks.
      Returns a function that takes `(method, path, onTry)` and creates a route.
      An example: `getRoutingCreator(app)('get', '/api', (req, res) => {})` is equal
      to `app.get('/api', (req, res) => {})`, but applies the same `onCatch` to all routes
  * `app`: Function/object that is generated from the server framework (ex: Express)
  * `onCatch`: Function to be executed on error for any route. Default `onCatch` is
      provided if you haven't specified it yourself.
