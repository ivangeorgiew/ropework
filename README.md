# Tied Pants
Error handling utilities for better user and developer experience.

In programming most errors could have been caught by developers, but they were
lazy or negligent. This is me trying (pun intended) to semi-automate the process
of catching errors so your app DOESN'T crash when it doesn't need to
and that it DOES when it should. All done with useful and friendly logging.

Be a good developer, tie your pants...

## Usage
To start using this package you need to first install locally:
`npm i tied-pants` or `yarn add tied-pants`

## Front-end Example:
```
import getErrorHandling from 'tied-pants'

const { createData } = getErrorHandling({
    onError: ({ description }) => {
        // TODO change with better user notification
        alert(`Issue with: ${description}`)
        // TODO add production logger that uses productionMsg
    }
})

const printNum = createData(
    'Printing a number',
    num => {
        blabla
        return num
    },
    ({ args: [num] }) => {
        console.log(`Ran inside catch - the argument was ${num}`)
        return 0
    }
)

const measureFib = createData(
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

const delayReturn = createData(
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
new Promise(() => { uncaughtAsyncFunc() })
setTimeout(() => { uncaughtSyncFunc() }, 500)
```

## Back-end Example:
```
const http = require('http')
const express = require('express')
const getErrorHandling = require('tied-pants')

const { createData, getHandledServer } = getErrorHandling()
const app = createData(
    'Express application',
    express(),
    ({ err, args: [req, res] }) => {
        if (!res.headersSent) {
            res.status(500).json({ message: err.message })
        }
    }
)

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res, next) => {
    res.send('Hello World!')

    throw new Error('whoops')
})
app.get('/err', async (req, res, next) => {
    await new Promise(resolve => setTimeout(resolve, 1000))

    throw new Error('Async whoops')
})

const server = getHandledServer(http.createServer(app))
const port = process.env.PORT || 8080

server.listen(port, function(err) {
    if (err) throw err
    console.log(`Server running at port ${port}`)
})
```

### API for parameters passed to imported function:
* `isDevelopment`
  * type: `boolean`
  * default: `process.env.NODE_ENV !== 'production'`
  * definition: Boolean to decide if we should log devMsg

* `devErrorLogger`
  * type: `devMsg` -> ?
  * default: `console.error`
  * definition: Function for logging developer errors
  * `devMsg`: ` Issue with: ${descr}\n Function arguments: ${stringOfArgs}\n`, `err`

* `onError`
  * type: `({ isUncaught, description, productionMsg })` -> ?
  * default: `() => {}`
  * definition: Function for notifying the user with friendly error messages
  and logging in production.
  * `isUncaught`: Boolean that indicates whether the error was caught or not
  * `description`: String that describes what the functionality was supposed to be doing
  * `productionMsg`: Stringified JSON that consists of useful info for production logging

### API for returned values from the imported function:
* `isDevelopment`
  * type: `boolean`
  * definition: Boolean that was parsed from `getErrorHandling`

* `devErrorLogger`
  * type: `devMsg` -> ?
  * definition: Function that was parsed from `getErrorHandling`

* `onError`
  * type: `({ isUncaught, description, productionMsg })` -> ?
  * definition: Function that was parsed from `getErrorHandling`

* `isObject`
  * type: val -> boolean
  * definition: Checks if the provided value is a true object {}

* `isBrowser`
  * type: `boolean`
  * definition: Tells if in browser environment or not

* `isNodeJS`
  * type: `boolean`
  * definition: Tells if in Node.js environment or not

* `stringifyAll`
  * type: `data` -> `stringified and parsed data`
  * definition: Takes any data and tries to stringify and format it
  * `data`: Any data that we parse and stringify

* `createData`
  * type: `(descr, data, onCatch)` || `(data, onCatch)` -> `error handled data`
  * definition: Error handles every type of data that you give it
  * `descr`: String that describes the data which you gave. Used for logging.
  * `data`: Any data which we error handle deeply. Arrays, functions and their arguments,
  objects and their methods, etc. Returns the error handled version. If object or function -
  for every method specified we can use `${methodName}Catch` to implement `onCatch`.
  * `onCatch`: Function which acts as default onCatch for the returned data. Accepts arguments
  `({ descr, err, args })`, where `descr` is same as above, `err`
  is the error caught Error, `args` are the arguments which were supplied to the tried function.

* `getHandledServer`
  * type: `server` -> `handledServer`
  * definition: Return a server that is error handled and closed gracefully on uncaught errors
  * `server`: Object that is the back-end server (ex: http.createServer(expressApp))
