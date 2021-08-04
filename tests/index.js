// const { tieUp } = require('tied-up')
// const { tieUpPartial } = require('tied-up/extras')

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
//     useCache: true,
//     onError: () => 'Not a number',
//     data: function (n, a, b, c, d, e) {
//         if (n <= 1) return n

//         const pre = fib.call(this, n - 2, a, b, c, d, e)
//         const prepre = fib.call(this, n - 1, a, b, c, d, e)

//         return pre + prepre
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

// console.log(fib.call(c, 500000, a, b, c, d, B))
// console.log(fib.call(c, 500000, a, b, c, d, B))
// console.log(fib.call(c, 4000, a, b, c, d, B))
// console.log(fib.call(c, 4000, a, b, c, d, B))

// console.time('fib')
// fib.call(c, 4000, a, b, c, d, B)
// console.timeEnd('fib')

// const e = new B({ a: 123, b: 5 })
// console.log(e.someMethod({}, [5, 10], () => {}, 5))
// console.log(e.otherMethod({ a: true }, [], 'supup', 5))

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
// fib = null
// global.gc()
// showMemory()

// const asyncGen = tieUp({
//     descr: 'Asynchronous generator function test',
//     argTypes: 'int',
//     useCache: true,
//     onError: () => 123,
//     data: async function* (i) {
//         // throw new Error('intended')
//         yield i
//         await new Promise(resolve => setTimeout(resolve, 2000))
//         return i + 10
//     }
// })

// ;(async () => {
//     console.log(await asyncGen(10).next())
//     console.log(await asyncGen(10).next())
// })()

// const gen = tieUp({
//     descr: 'Generator function test',
//     argTypes: 'int',
//     useCache: true,
//     onError: () => 123,
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
//     useCache: true,
//     onError: async () => 'error val',
//     data: async function (i) {
//         // throw new Error('intended')
//         // await asyncF(i + 1)
//         await new Promise(resolve => setTimeout(resolve, 1000))
//         return i
//     }
// })

// ;(async () => {
//     console.log(await asyncF(10))
//     console.log(await asyncF(10))
// })()

// const addNumbers = tieUpPartial({
//     descr: 'adding two numbers',
//     argTypesOuter: 'int | string',
//     useCacheOuter: true,
//     argTypes: 'int | string',
//     useCache: true,
//     onError: () => 'There was an error',
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

// // const addTenTo = addNumbers('sup')
// // console.log(addTenTo('sup'))

// const addTenTo = addNumbers(10)
// const copyOfAddTenTo = addNumbers(10)
// console.log(addTenTo(5))
// console.log(copyOfAddTenTo(5))
// console.log(copyOfAddTenTo('bla'))
