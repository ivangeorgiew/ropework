# pure-error-handling
Error handling functions, object methods and whatever you can think of...

!!! Do note that this is the documentation for V3.0.0 !!!

## Usage
To start using this package you need to first install locally:
`npm i pure-error-handling` or `yarn add pure-error-handling`

## Front-end Example:
```
import pureErrorHandling from 'pure-error-handling'

const errorHandlers = pureErrorHandling({ notifyUser: alert })
const { createFunc, initUncaughtErrorHandling } = errorHandlers

initUncaughtErrorHandling()

const printNum = createFunc(
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
new Promise(() => { uncaughtAsyncFunc() })
setTimeout(() => { uncaughtSyncFunc() }, 500)
```

## Back-end Example:
```
const http = require('http')
const express = require('express')
const cors = require('cors')
const pureErrorHandling = require('pure-error-handling')

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 8080
const { createAppWrapper, initUncaughtErrorHandling } = pureErrorHandling()
const wrapApp = createAppWrapper(app)

initUncaughtErrorHandling(server)

wrapApp('use', express.urlencoded({ extended: true }))
wrapApp('use', express.json())
wrapApp('use', cors())

wrapApp('get', '/', (req, res, next) => {
    res.send('Hello World!')

    throw new Error('whoops')
})

wrapApp('get', '/err', async (req, res, next) => {
    await new Promise(resolve => setTimeout(resolve, 1000))

    throw new Error('Async whoops')
})

server.listen(port, function(err) {
    if (err) throw err
    console.log(`Server running at port ${port}`)
})
```

### API for `pureErrorHandling` (or whatever you call it):
* `isProduction`
    ** type: `boolean`
    ** default: `process.env.NODE_ENV === 'production'`
    ** description: Used for deciding which functionality to use (ex: use logInProd or not)

* `notifyUser`
    ** type: `userMsg` -> ?
    ** default: `() => {}`
    ** description: Called with the user message only in the browser
    ** `userMsg`: `Internal error with: ${funcDesc}`

* `logInProd`
    ** type: `stringifiedParams` -> ?
    ** default: `() => {}`
    ** description: Called with the JSON string that contains info about the error
    ** `stringifiedParams`: `stringifyAll({ functionDescription, arguments, date, error, localUrl, machineInfo })`

### API for `errorHandlers` (or whatever you call it):
* `isBrowser`
    ** type: `boolean`
    ** description: Tells if in browser environment or not

* `isNodeJS`
    ** type: `boolean`
    ** description: Tells if in Node.js environment or not

* `stringifyAll`
    ** type: `data` -> `stringified and parsed data`
    ** description: Takes any data and tries to stringify and format it
    ** `data`: Any data that we parse and stringify

* `logError`
    ** type: `({ funcDesc, err, args })` -> `undefined`
    ** description: Takes an object with settings and logs both in dev and prod
    ** `funcDesc`: String that describes the function
    ** `err`: Error instance
    ** `args`: Array from the function arguments

* `createFunc`
    ** type: `(funcDesc, onTry, onCatch)` -> `error handled function`
    ** description: Error handles with try and catch any function
    ** `funcDesc`: String that describes the function
    ** `onTry`: Function which we actually want to use later
    ** `onCatch`: Function which runs in addition to the logging of logError
      Has the same arguments as onTry and returns a value on error if you want

* `createObject`
    ** type: `obj` -> `error handled object`
    ** description: Error handles every prop of an object
    ** `obj`: Object which whose methods we want to error handle.
      For every method specified we can use `${methodName}Catch` to implement `onCatch`
      like in the createFunc function

* `createAppWrapper`
    ** type: `app` -> `(method, path, callback)` || `(method, callback)` -> `undefined`
    ** description: Wrapper which takes an instance of `express()` and error handles it
    ** `app`: Express.js object returned from `express()`
    ** `method`: String used for `app.method()`
    ** `path`: String used for `app.method(path, callback)` OR
            Function used for `app.method(middleware)`
    ** `callback`: Function used for `app.method(path, callback)`

* `initUncaughtErrorHandling`
    ** type: `server` -> `undefined`
    ** description: Start the handling of uncaught errors
    ** `server`: Object that is used only when the environment is Node.js
