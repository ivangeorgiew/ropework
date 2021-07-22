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

// const { changeOptions, clearCache, tieUp, tieUpPartial } = require('tied-up')

// changeOptions({ isDevelopment: true })

// const aType = '()'
// const fibArgTypes = `
//     int >= 0,
//     ${aType} | undef,
//     () | undef,
//     @Error | undef,
//     [ :length: int = 2 ] | undef,
//     { :b: int, :a: ${aType} } | undef,
//     () | undef
// `

// let fib = tieUp({
//     descr: 'calculating fibonacci number',
//     argTypes: fibArgTypes,
//     useCache: ([n]) => [n],
//     onError: () => NaN,
//     data: function (n, a, b, c, d, e) {
//         if (n <= 1) return n

//         const pre = fib.call(this, n - 2, a, b, c, d, e)
//         const prepre = fib.call(this, n - 1, a, b, c, d, e)

//         return pre + prepre
//     }
// })

// let measureFib = tieUp({
//     descr: 'measuring the time it takes to calculate fibonacci number',
//     argTypes: fibArgTypes,
//     onError: () => 'Incorrect fibonacchi calculation',
//     data: function (n, a, b, c, d, e) {
//         const startTime = Date.now()

//         try {
//             return fib.call(this, n, a, b, c, d, e)
//         } finally {
//             console.log(`execution time ${Date.now() - startTime}ms`)
//         }
//     }
// })

// const a = () => {
//     throw new Error('sup')
// }
// const b = new Error('blabla')
// const c = [5, 6]
// const d = { b: 6, a }

// d.myself = d

// const A = tieUp({
//     descr: 'class A',
//     data: class {
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
// })

// const B = tieUp({
//     descr: 'class B',
//     data: class extends A {
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
// })

// const e = new B({ a: 123, b: 5 })
// console.log(e.someMethod({}, [5, 10], () => {}, 5))
// console.log(e.otherMethod({ a: true }, [], 'supup', 5))

// console.log(measureFib.call(c, 500000, a, b, c, d, B))
// console.log(measureFib.call(c, 4000, a, b, c, d, B))
// console.log(measureFib.call(c, 4000, a, b, c, d, B))

// // node --expose-gc
// const showMemory = () => {
//     const used = process.memoryUsage()

//     for (const objKey in used) {
//         console.log(
//             `${objKey}: ${
//                 Math.round((used[objKey] / 1024 / 1024) * 100) / 100
//             } MB`
//         )
//     }
// }
// showMemory()
// for (let i = 1; i <= 100; i++) {
//     fib.call(c, i * 3000, a, b, c, d, B)
//     // tieUp({ descr: 'uaoeu', data: function () {} })
// }
// showMemory()
// // fib = null
// // measureFib = null
// global.gc()
// showMemory()

// const asyncGen = tieUp({
//     descr: 'Asynchronous generator function test',
//     argTypes: 'int',
//     useCache: args => args,
//     data: async function* (i) {
//         // throw new Error('intended')
//         yield i
//         await new Promise(resolve => setTimeout(resolve, 1000))
//         return i + 10
//     }
// })

// asyncGen(10)
//     .next()
//     .then(res => {
//         console.log(res)

//         asyncGen(10)
//             .next()
//             .then(res => {
//                 console.log(res)
//             })
//     })

// const gen = tieUp({
//     descr: 'Generator function test',
//     argTypes: 'int',
//     useCache: args => args,
//     data: function* (i) {
//         // throw new Error('intended')
//         yield i
//         return i + 10
//     }
// })

// console.log(gen(10).next())
// console.log(gen(10).next())

// const asyncF = tieUp({
//     descr: 'Asynchronous function test',
//     argTypes: 'int',
//     useCache: args => args,
//     data: async function (i) {
//         await new Promise(resolve => setTimeout(resolve, 1000))
//         // throw new Error('intended')
//         return i
//     }
// })

// asyncF(10).then(res => {
//     console.log(res)
//     asyncF(10).then(res => {
//         console.log(res)
//     })
// })

// const loopAsync = tieUp({
//     descr: 'cached loop async function',
//     argTypes: '(), int',
//     useCache: args => args,
//     onError: () => new Promise(),
//     data: (fn, n) =>
//         new Promise(resolve => {
//             let v

//             for (let i = 0; i < n; i++) {
//                 v = fn(i)
//             }

//             resolve(v)
//         })
// })

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

// const addNumbers = tieUpPartial({
//     descr: 'adding two numbers',
//     argTypesOuter: 'int | string',
//     useCacheOuter: args => args,
//     useCache: args => args,
//     argTypes: 'int | string',
//     data: a => {
//         console.log('ran outer')

//         if (typeof a === 'string') {
//             throw new Error('Outer error - please pass number')
//         }

//         return b => {
//             console.log('ran inner')

//             if (typeof b === 'string') {
//                 throw new Error('Inner error - please pass number')
//             }

//             return a + b
//         }
//     }
// })

// const addTenTo = addNumbers('sup')
// console.log(addTenTo('sup'))

// const addTenTo = addNumbers(10)
// const copyOfAddTenTo = addNumbers(10)
// console.log(addTenTo(5))
// console.log(copyOfAddTenTo(5))
// console.log(copyOfAddTenTo('bla'))
