# Tied-Up

Error-handling and other function utilities for better user and developer experience.

In programming most errors could have been caught by developers, but they were lazy
or negligent. This is me trying to semi-automate the process of catching errors so
your app only crashes when it really should. All done with useful and friendly
logging. Also extremely powerful caching is included and runtime validation of
function arguments.

## Usage

To start using this package you need to first install locally: `npm i tied-up` or
`pnpm add tied-up` or `yarn add tied-up`

## Front-end Example:

```
import { tieEff, FriendlyError, changeOptions } from 'tied-up'

changeOptions({
    notify: ({ isDev, isFriendlyError, errorDescr, prodInfo }) => {
        // TODO if app is for developers, remove isFriendlyError check
        if (isFriendlyError) {
            // TODO change with WARNING notification
            alert(`WARNING - ${error.message}`)
        }

        // TODO add production logger that uses prodInfo
        if (!isDev) {
            // callProdLoggerService(prodInfo)
        }
    }
})

const printNum = tieEff({
    descr: 'printing a number',
    argTypes: 'num',
    data: num => {
        blabla
        return num
    },
    onError: ({ args: [num] }) => {
        console.log(`Ran inside catch - the argument was ${num}`)
        return 0
    }
})

const fib = tieEff({
    descr: 'calculating fibonacci number',
    argTypes: 'int',
    useCache: ([n]) => [n],
    onError: () => 0,
    data: (n) => {
        if (n < 0 || Math.trunc(n) !== n)
            throw new FriendlyError('The passed input wasnt possitive number')

        return n <= 1 ? n : fib(n-1) + fib(n-2)
    }
})

const measureFib = tieEff({
    descr: 'Measuring time for fibonacci number',
    argTypes: 'int',
    data: num => {
        const startTime = Date.now()

        try {
            return fib(num)
        } finally {
            console.log(`execution time ${Date.now() - startTime}ms`)
        }
    },
    onError: () => 'Incorrect fibonacchi calculation'
})

const delayReturn = tieEff({
    descr: 'Delaying async function',
    argTypes: 'int >= 500 <= 2000',
    data: async (ms) => {
        await new Promise(resolve => setTimeout(resolve, ms))

        if (typeof ms === 'number')
            return 'Proper result'
        else
            throw new FriendlyError('Could not delay properly')
    },
    onError: () => 'Default result'
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
const { getHandledServer, getRoutingCreator } = require('tied-up')

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

### API for returned values from the imported function:

-   `isDev`

    -   type: `boolean`
    -   definition: Boolean parameter that was parsed from `tied-up`

-   `errorLogger`

    -   type: `errMsg` -> ?
    -   definition: Function parameter that was parsed from `tied-up`

-   `notify`

    -   type: `({ isDev, isFriendlyError, error, errorDescr, prodInfo })` -> ?
    -   definition: Function parameter that was parsed from `tied-up`

-   `FriendlyError`

    -   type: `constructor`
    -   definition: Constructor that extends `Error`. Use it in functions created
        with `tieEff` to signify that the error was thrown intentionally and that the
        message is user friendly

-   `tieEff`

    -   type: `({ descr, data, argTypes, onError, useCache })` ->
        `error handled data`
    -   definition: Function that error handles any type of data that you give it.
    -   `descr`: String that describes the data. Can be ommited. It is used to name
        functions and for better description in errors.
    -   `data`: Any data which we error handle deeply. Arrays, functions and their
        arguments, objects and their methods, etc.
    -   `onError`: Function that executes after the internal catch logic. Can be used
        to return a default value on error. Accepts arguments
        `({ descr, args, error })`. Additionaly, a method with name
        `someMethodOnError` is considered the same as this function, but for
        `someMethod`.
    -   `useCache`: Function that if given enables extremely fast, memory efficient
        caching. Example: `(args) => [args[1]]`. Where `args` are the function
        arguments. The function must return an array which be will used for creating
        a cache key. `this` is automatically used every time for the creating of the
        cache key. Additionaly, a method with the name `someMethodUseCache` is
        considered the same as this function, but for `someMethod`.
    -   `argTypes`: String which is used for checking function arguments types.
        Supports simple types which start with the following wording `bool`, `null`,
        `undef`, `any`, but `booleanSomeOtherChars` would also work. Type for
        checking if an instance of is `@URIError` - must start with `@` immediately
        followed by the constructor. Also supports the following types: `str`, `num`,
        `int`. This is valid: `int > 10 <= 123`, `str = 44`. Must start with
        `int (=|>|>=) 1234` and optionally followed by `(<|<=) 4321`. Objects - `{}`,
        arrays - `[]`, functions - `()` can be so defined or can contain property
        keys to be checked with the syntax -
        `[ :my Specialy,% key: int, :length: 4, :a: { :b: bool } ]`. The key must be
        between the starting and ending `:`. Finally - any of those types can be
        followed by `|` which indicates OR some other type -
        `null | { :a: @Error | {} | undef }`. Full example:
        ```
         const argTypes = `
             str >= 10 <= 20 | [],
             {
                 :my Arr: [ :0: str, :length: int < 3 ] | null,
                 :inner: { :abc: str >= 5 | any, :ii: undef },
                 :map: ( :su: bool ) | [ :2: int ] | undef,
                 :obj: { :b: undef, :c: ( :d: { :abc: int } ) }
             } | { :my: any },
             @URIError,
             { :date: @Date },
             any,
        `
        ```

-   `getHandledServer`

    -   type: `(server, sockets)` -> `handledServer`
    -   definition: Returns a server that is error handled and closed on uncaught
        errors
    -   `server`: Object that is the back-end server (ex:
        http.createServer(expressApp))
    -   `sockets`: Optional `Set` of sockets, if not provided an empty `Set` is used
        insted.

-   `getRoutingCreator`

    -   type: `(app, onError)` -> `createRoute`
    -   definition: Creates a function that can be used with different server
        frameworks. Returns a function that takes `(method, path, onTry)` and creates
        a route. An example:
        `getRoutingCreator(app)('get', '/api', (req, res) => {})` is equal to
        `app.get('/api', (req, res) => {})`, but applies the same `onError` to all
        routes
    -   `app`: Function/object that is generated from the server framework (ex:
        Express)
    -   `onError`: Function to be executed on error for any route. Default `onError`
        is provided if you haven't specified it yourself.

-   `changeOptions`
    -   type: `({ isDev, errorLogger, notify })` -> ?
    -   definition: Changes the options according to the below api

### API for options:

-   `isDev`

    -   type: `boolean`
    -   default: `process.env.NODE_ENV !== 'production'`
    -   definition: Boolean that indicates if the environment is not in prod

-   `errorLogger`

    -   type: `errMsg` -> ?
    -   default: `console.error`
    -   definition: Function for logging developer errors
    -   `errMsg`: ` Issue with: ${descr}\n Function arguments: ${stringOfArgs}\n`,
        `err`

-   `notify`
    -   type: `({ isDev, isFriendlyError, errorDescr, prodInfo, error })` -> ?
    -   default: `() => {}`
    -   definition: Function for notifying the user with friendly error messages and
        logging in production.
    -   `isDev`: Boolean that indicates if the environment is not in prod
    -   `isFriendlyError`: Boolean that indicates whether `error.message` is for
        regular users
    -   `errorDescr`: String that describes what the functionality was supposed to be
        doing
    -   `prodInfo`: Object that consists of useful info for production logging
    -   `error`: Error object that was thrown
