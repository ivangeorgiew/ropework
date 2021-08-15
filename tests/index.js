// const { tieUp, globalHandleErrors } = require('tied-up')
// globalHandleErrors(true)

// const fib = tieUp(
//     'calculating fibonacci number',
//     () => 'Not a number',
//     function (n, a, b, c, d, e) {
//         if (n <= 1) return n

//         const pre = fib.call(this, n - 2, a, b, c, d, e)
//         const prepre = fib.call(this, n - 1, a, b, c, d, e)

//         return pre + prepre
//     }
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
//     () => ({}),
//     class {
//         constructor({ a }) {
//             this.a = a
//             this.b = 6
//         }
//     }
// )

// const B = tieUp(
//     'class B',
//     () => ({}),
//     class extends A {
//         constructor({ a, b }) {
//             super({ a })
//             this.c = b
//         }
//     }
// )

// console.log(fib.call(c, 500000, a, b, c, d, B))
// console.log(fib.call(c, 500000, a, b, c, d, B))
// console.log(fib.call(c, 4000, a, b, c, d, B))
// console.log(fib.call(c, 4000, a, b, c, d, B))

// console.time('fib')
// fib.call(c, 4000, a, b, c, d, B)
// console.timeEnd('fib')

// const showMemory = () => {
//     const used = process.memoryUsage()

//     for (const objKey in used) {
//         console.log(
//             `${objKey}: ${Math.round((used[objKey] / 1024 / 1024) * 100) / 100} MB`
//         )
//     }
// }
// // const testFunc = function (a, b, c, d, e, f) {
// //     return [a, b, c, d, e, f]
// // }
// showMemory()
// for (let i = 1; i <= 1000; i++) {
//     fib.call(c, 1000, a, b, c, d, B)
//     // testFunc.call(c, 5, a, b, c, d, B)
// }
// showMemory()

// const asyncGen = tieUp(
//     'asynchronous generator function test',
//     () => 123,
//     async function* (i) {
//         yield i
//         await new Promise(resolve => setTimeout(resolve, 1000))
//         // throw new Error('intended')
//         return i + 10
//     }
// )

// ;(async () => {
//     const g1 = asyncGen(10)
//     console.log(await g1.next())
//     console.log(await g1.next())
//     console.log(await g1.next())

//     const g2 = asyncGen(10)
//     console.log(await g2.next())
// })()

// const gen = tieUp(
//     'generator function test',
//     () => 123,
//     function* (i) {
//         yield i
//         // throw new Error('intended')
//         return i + 10
//     }
// )

// const g1 = gen(10)
// console.log(g1.next())
// console.log(g1.next())
// console.log(g1.next())
// const g2 = gen(10)
// console.log(g2.next())

// const asyncF = tieUp(
//     'asynchronous function test',
//     () => 'error val',
//     async function (i) {
//         // await asyncF(i + 1)
//         await new Promise(resolve => setTimeout(resolve, 1000))
//         // throw new Error('intended')
//         return i
//     }
// )

// ;(async () => {
//     const a = await asyncF(10)
//     console.log(a)
//     console.log(asyncF(10))
//     const b = await asyncF(10)
//     console.log(b)
//     console.log(asyncF(10))
// })()

// const addNumbers = tieUp(
//     'create function to add numbers',
//     () => () => 'There was an error',
//     a => {
//         console.log('ran outer')

//         if (typeof a === 'string') {
//             throw new Error('Outer error - please pass number')
//         }

//         return tieUp(
//             'adding two number',
//             () => 'There was an error',
//             b => {
//                 console.log('ran inner')

//                 if (typeof b === 'string') {
//                     throw new Error('Inner error - please pass number')
//                 }

//                 return a + b
//             }
//         )
//     }
// )

// const addTenTo = addNumbers('sup')
// console.log(addTenTo('sup'))

// const addTenTo = addNumbers(10)
// const copyOfAddTenTo = addNumbers(10)
// console.log(addTenTo(5))
// console.log(copyOfAddTenTo(5))
// console.log(copyOfAddTenTo('bla'))
