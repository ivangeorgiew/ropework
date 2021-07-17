// const { FriendlyError, changeOptions, tieUp } = require('../dist/index')

// changeOptions({ isDevelopment: true })

/* bool
 * null
 * undef
 * @URIError (for check use window['URIError'])
 * str, str <= 10, str >= 0, str >= 0 <= 10, str = 5
 * num, num <= 10, num >= 0, num >= 0 <= 10, num = 5
 * int, int <= 10, int >= 0, int >= 0 <= 10, int = 5
 * [], [ length: int > 2, someProp: bool ]
 * {}, { a: num >= 5, b: bool }
 * (), ( a: ( b: [] ) )
 * combination of with |
 */

// const testArgTypes = `
//     str >= 10 <= 20 | [],
//     {
//         :my Arr: [ :0: str, :length: int < 3 ] | null,
//         :inner: { :abc: str >= 5 | bool, :ii: undef },
//         :map: ( :su: bool ) | [ :2: int ] | undef,
//         :obj: { :b: undef, :c: ( :d: { :abc: int } ) }
//     } | { :my: int },
//     @URIError,
//     { :date: @Date },
// `
// const testArgTypes = `
//     str >= 10 <= 20 | [ :0: int ] | null,
//     { :a b: () | undef, :c: int },
//     boolean   ,
//     undef,
//     @URIError | @Error | null,
//     int > 5 <= 10
// `

// console.dir(parseArgTypes({ argTypes: testArgTypes }), { depth: null })

// const commonFib = function (n) {
//     try {
//         if (typeof n !== 'number' || n < 0) {
//             throw new Error('Please pass a positive integer')
//         } else if (n > 1e7) {
//             return Infinity
//         } else if (n < 2) {
//             return n
//         }

//         let [res, pre1, pre2] = [0, 0, 1]

//         while (--n) {
//             res = pre1 + pre2
//             pre1 = pre2
//             pre2 = res
//         }

//         return res
//     } catch (err) {
//         console.error(err)

//         return NaN
//     }
// }

// const t = Date.now()
// console.log(commonFib(1e7))
// console.log(`exec in ${Date.now() - t}ms`)
// const used = process.memoryUsage()
// for (const objKey in used) {
//     console.log(
//         `${objKey}: ${Math.round((used[objKey] / 1024 / 1024) * 100) / 100} MB`
//     )
// }

// const fib = tieUp(
//     'calculating fibonacci number',
//     function (n, a, b, c, d, e) {
//         if (n < 0 || Math.trunc(n) !== n) {
//             throw new FriendlyError('The passed input wasnt possitive number')
//         } else if (n > 1) {
//             const pre = fib.call(this, n - 2, a, b, c, d, e)
//             const prepre = fib.call(this, n - 1, a, b, c, d, e)

//             return pre + prepre
//         }

//         return n
//     },
//     { useCache: ([n]) => [n], onError: () => NaN }
// )

// const measureFib = tieUp(
//     'measuring the time it takes to calculate fibonacci number',
//     function (n, a, b, c, d, e) {
//         const startTime = Date.now()

//         try {
//             return fib.call(this, n, a, b, c, d, e)
//         } finally {
//             console.log(`execution time ${Date.now() - startTime}ms`)
//         }
//     },
//     { onError: () => 'Incorrect fibonacchi calculation' }
// )

// const a = () => {
//     throw new Error('sup')
// }
// const b = new Error('blabla')
// const c = [5, 6]
// const d = { b: 6, a }

// d.myself = d

// const A = tieUp(
//     'class A',
//     class {
//         constructor({ a }) {
//             this.a = a
//             this.b = 6
//         }

//         someMethod() {
//             throw new Error('intentional error')
//             // return 'sup'
//         }

//         someMethodOnError() {
//             return 5
//         }
//     }
// )

// const B = tieUp(
//     'class B',
//     class extends A {
//         constructor({ a, b }) {
//             super({ a })
//             this.c = b
//         }

//         otherMethod() {
//             throw new Error('other error')
//             // return 'bla'
//         }

//         otherMethodOnError() {
//             return 10
//         }
//     }
// )

// const e = new B({ a: 123, b: 5 })
// console.log(e.someMethod({}, [5, 10], () => {}, 5))
// console.log(e.otherMethod({ a: true }, [], 'supup', 5))

// console.log(measureFib.call(c, 4300, a, b, c, d, B))
// console.log(measureFib.call(c, 3800, a, b, c, d, B))
// console.log(measureFib.call(c, 3800, a, b, c, d, B))

// node --expose-gc
// let used = process.memoryUsage()
// for (const objKey in used) {
//     console.log(
//         `${objKey}: ${Math.round((used[objKey] / 1024 / 1024) * 100) / 100} MB`
//     )
// }
// for (let i = 1; i <= 10000; i++) {
//     // console.log(measureFib.call(c, i * 4000, a, b, c, d, B))
//     tieUp('uaoeu', function () {})
// }
// used = process.memoryUsage()
// for (const objKey in used) {
//     console.log(
//         `${objKey}: ${Math.round((used[objKey] / 1024 / 1024) * 100) / 100} MB`
//     )
// }
// for (let i = 1; i <= 10000; i++) {
//     // console.log(measureFib.call(c, i * 4000, a, b, c, d, B))
//     tieUp('uaoeu', function () {})
// }
// used = process.memoryUsage()
// for (const objKey in used) {
//     console.log(
//         `${objKey}: ${Math.round((used[objKey] / 1024 / 1024) * 100) / 100} MB`
//     )
// }
// global.gc()
// used = process.memoryUsage()
// for (const objKey in used) {
//     console.log(
//         `${objKey}: ${Math.round((used[objKey] / 1024 / 1024) * 100) / 100} MB`
//     )
// }

// const asyncGen = tieUp(
//     'Asynchronous generator function test',
//     async function* (i) {
//         yield i
//         // throw new Error('intended')
//         await new Promise(resolve => setTimeout(resolve, 1000))
//         return i + 10
//     }
// )
// const rag = asyncGen(10)

// rag.next().then(res => {
//     console.log(res)

//     rag.next().then(res => {
//         console.log(res)
//     })
// })

// const gen = tieUp(
//     'Generator function test',
//     function* (i) {
//         yield i
//         // throw new Error('intended')
//         return i + 10
//     },
//     { useCache: args => args }
// )

// console.log(gen(10).next())
// console.log(gen(10).next())

// const asyncF = tieUp(
//     'Asynchronous function test',
//     async function (i) {
//         await new Promise(resolve => setTimeout(resolve, 1000))
//         // throw new Error('intended')
//         return i
//     },
//     { useCache: args => args }
// )

// asyncF(10).then(res => {
//     console.log(res)
//     asyncF(10).then(res => {
//         console.log(res)
//     })
// })

// const loopAsync = tieUp(
//     'cached loop async function',
//     (fn, n) =>
//         new Promise((resolve, reject) => {
//             let v

//             for (let i = 0; i < n; i++) {
//                 v = fn(i)
//             }

//             resolve(v)
//         }),
//     { useCache: args => args, onError: () => new Promise() }
// )

// let startTime = Date.now()

// loopAsync(Math.sqrt, 1e9).then(result => {
//     console.log(`executed in ${Date.now() - startTime}ms`)
//     console.log(result)
//     startTime = Date.now()

//     loopAsync(Math.sqrt, 1e9).then(result => {
//         console.log(`executed in ${Date.now() - startTime}ms`)
//         console.log(result)
//     })
// })

// const addNumbers = tieUpPartial(
//     'adding two numbers',
//     a => {
//         console.log('ran outer')

//         if (typeof a !== 'number') {
//             throw new Error('Outer error - please pass number')
//         }

//         // return []
//         return b => {
//             if (typeof b !== 'number') {
//                 throw new Error('Inner error - please pass number')
//             }

//             return a + b
//         }
//     },
//     { useOuterCache: args => args }
// )

// const addTenTo = addNumbers('sup')
// console.log(addTenTo('sup'))

// const addTenTo = addNumbers(10)
// const copyOfAddTenTo = addNumbers(10)
// console.log(addTenTo(5))
// console.log(copyOfAddTenTo(6))
// console.log(copyOfAddTenTo('bla'))
