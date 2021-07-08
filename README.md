# Tied Pants
Error handling utilities for better user and developer experience.

In programming most errors could have been caught by developers, but they were
lazy or negligent. This is me trying (pun intended) to semi-automate the process
of catching errors so your app only crashes when it really should. All done with
useful and friendly logging. Oh, also extremely powerful caching is included.

Be a good developer, tie your pants!

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

const printNum = tieUp(
    'printing a number',
    num => {
        blabla
        return num
    },
    { onError: ({ args: [num] }) => {
        console.log(`Ran inside catch - the argument was ${num}`)
        return 0
    } }
)

const fib = tieUp(
    'calculating fibonacci number',
    (n) => {
        if (n < 0 || Math.trunc(n) !== n)
            throw new FriendlyError('The passed input wasnt possitive number')

        return n <= 1 ? n : fib(n-1) + fib(n-2)
    },
    { useCache: ([n]) => [n], onError: () => 0 }
)

const measureFib = tieUp(
    'Measuring time for fibonacci number',
    num => {
        const startTime = Date.now()

        try {
            return fib(num)
        } finally {
            console.log(`execution time ${Date.now() - startTime}ms`)
        }
    },
    { onError: () => 'Incorrect fibonacchi calculation' }
)

const delayReturn = tieUp(
    'Delaying async function',
    async (ms) => {
        await new Promise(resolve => setTimeout(resolve, ms))

        if (typeof ms === 'number')
            return 'Proper result'
        else
            throw new FriendlyError('Could not delay properly')
    },
    { onError: () => 'Default result' }
)

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

* `shouldFreezePage`
  * type: `boolean`
  * default: `false`
  * definition: Should the webpage be frozen on unhandled error

* `errorLogger`
  * type: `errMsg` -> ?
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
  * `isFriendly`: Boolean that indicates whether `userMsg` is for regular users
  * `userMsg`: String that describes what the functionality was supposed to be doing
  * `productionInfo`: Object that consists of useful info for production logging
  * `error`: Error object that was thrown

### API for returned values from the imported function:
* `isDevelopment`
  * type: `boolean`
  * definition: Boolean parameter that was parsed from `tiedPants`

* `errorLogger`
  * type: `errMsg` -> ?
  * definition: Function parameter that was parsed from `tiedPants`

* `notify`
  * type: `({ isUncaught, isFriendly, userMsg, productionInfo })` -> ?
  * definition: Function parameter that was parsed from `tiedPants`

* `FriendlyError`
  * type: `constructor`
  * definition: Constructor that extends `Error`. Use it in functions created
      with `tieUp` to signify that the error was thrown intentionally and that
      the message is user friendly

* `tieUp`
  * type: `(descr, data, { onError, useCache })` -> `error handled data`
  * definition: Function that error handles any type of data that you give it.
  * `descr`: String that describes the data. Can be ommited. It is used to name functions
      and for better description in errors.
  * `data`: Any data which we error handle deeply. Arrays, functions and their
      arguments, objects and their methods, etc.
  * `onError`: Function that executes after the internal catch logic. Can be used to
      return a default value on error. Accepts arguments `({ descr, args, error })`.
      Additionaly, a method with name `someMethodOnError` is considered the same as this
      function, but for `someMethod`.
  * `useCache`: Function that if given enables extremely fast, memory efficient caching.
      Example: `(args) => [args[1]]`. Where `args` are the function arguments.
      The function must return an array which be will used for creating a cache key. `this`
      is automatically used every time for the creating of the cache key.
      Additionaly, a method with the name `someMethodUseCache` is considered
      the same as this function, but for `someMethod`.

* `tieUpPartial`
  * type: `(descr, data, { onOuterError, onError, useOuterCache, useCache })` ->
      `error handled function`
  * definition: Function that error handles a function that returns another function.
  * `descr`: String used for `descr` of the inner function.
  * `data`: Function that returns another function. Example: `() => () => {}`.
  * `onOuterError`: Same as above for the outer function. Defaults to `() => () => {}`.
  * `onError`: Same as above for the inner function.
  * `useOuterCache`: Same as above for the outer function.
  * `usecache`: Same as above for the inner function.

* `clearCache`
  * type: `tiedFunc` -> ?
  * definition: Function that clears the cache of the provided tied function.
  * `tiedFunc`: Function that was created with `tieUp` and has caching enabled
      via `useCache`.

* `clearAllCaches`
  * type: `()` -> ?
  * definition: Function that clears all function caches.

* `getHandledServer`
  * type: `(server, sockets)` -> `handledServer`
  * definition: Returns a server that is error handled and closed on uncaught errors
  * `server`: Object that is the back-end server (ex: http.createServer(expressApp))
  * `sockets`: Optional `Set` of sockets, if not provided an empty `Set` is used insted.

* `getRoutingCreator`
  * type: `(app, onError)` -> `createRoute`
  * definition: Creates a function that can be used with different server frameworks.
      Returns a function that takes `(method, path, onTry)` and creates a route.
      An example: `getRoutingCreator(app)('get', '/api', (req, res) => {})` is equal
      to `app.get('/api', (req, res) => {})`, but applies the same `onError` to all routes
  * `app`: Function/object that is generated from the server framework (ex: Express)
  * `onError`: Function to be executed on error for any route. Default `onError` is
      provided if you haven't specified it yourself.
