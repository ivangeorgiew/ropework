// const { tiePure, globalHandleErrors } = require("../dist/test.cjs.js")
// globalHandleErrors(true)

// const fib = tiePure(
//     "calculating fibonacci number",
//     () => "Not a number",
//     (n, a, b, c, d, e) => {
//         if (n <= 1) return n

//         const pre = fib(n - 2, a, b, c, d, e)
//         const prepre = fib(n - 1, a, b, c, d, e)

//         return pre + prepre
//     }
// )

// const a = () => {
//     throw new Error("sup")
// }
// const b = new Error("blabla")
// const c = [5, 6]
// const d = { b: 6, a }

// d.myself = d

// const A = tiePure(
//     "class A",
//     () => ({}),
//     class {
//         constructor({ a }) {
//             this.a = a
//             this.b = 6
//         }
//     }
// )

// const B = tiePure(
//     "class B",
//     () => ({}),
//     class extends A {
//         constructor({ a, b }) {
//             super({ a })
//             this.c = b
//         }
//     }
// )

// console.log(fib(500000, a, b, c, d, B))
// console.log(fib(500000, a, b, c, d, B))
// console.log(fib(4000, a, b, c, d, B))
// console.log(fib(4000, a, b, c, d, B))

// const asyncGen = tiePure(
//     "asynchronous generator function test",
//     () => 123,
//     async function* (i) {
//         yield i
//         await new Promise(resolve => {
//             setTimeout(resolve, 1000)
//         })
//         // throw new Error("intended")
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

// const gen = tiePure(
//     "generator function test",
//     () => 123,
//     function* (i) {
//         yield i
//         // throw new Error("intended")
//         return i + 10
//     }
// )

// const g1 = gen(10)
// console.log(g1.next())
// console.log(g1.next())
// console.log(g1.next())
// const g2 = gen(10)
// console.log(g2.next())

// const asyncF = tiePure(
//     "asynchronous function test",
//     () => "error val",
//     async i => {
//         // await asyncF(i + 1)
//         await new Promise(resolve => {
//             setTimeout(resolve, 1000)
//         })
//         // throw new Error("intended")
//         return i
//     }
// )

// ;(async () => {
//     // console.log(await asyncF(10))
//     // console.log(await asyncF(10))

//     const a = await asyncF(10)
//     console.log(a)
//     console.log(asyncF(10))
//     const b = await asyncF(10)
//     console.log(b)
//     console.log(asyncF(10))
// })()

// const { checkNum, or } = require("../dist/test.cjs.js")
// const addNumbers = tiePure(
//     "adding two numbers",
//     () => "There was an error",
//     (a, b) => {
//         console.log("ran func")
//         or(checkNum(a), TypeError("First arg must be number"))
//         or(checkNum(b), TypeError("Second arg must be number"))

//         return a + b
//     }
// )

// const addSupTo = addNumbers("sup")
// const addTenTo = addNumbers(10)
// const copyOfAddTenTo = addNumbers(10)

// console.log(addSupTo(5))
// console.log(addTenTo(5))
// console.log(copyOfAddTenTo(5))
// console.log(copyOfAddTenTo("bla"))

// console.log(copyOfAddTenTo())
