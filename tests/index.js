// const {
//     tie,
//     changeOptions,
//     handleGlobalErrors,
//     idxDef,
//     definedDef,
//     createDef,
// } = require("../dist/index.cjs.test.js")

// handleGlobalErrors(true)

// const fib = tie(
//     "pure calculating fibonacci number",
//     [idxDef, definedDef, definedDef, definedDef, definedDef, definedDef],
//     (n, a, b, c, d, e) => {
//         if (n <= 1) return n

//         const pre = fib(n - 2, a, b, c, d, e)
//         const prepre = fib(n - 1, a, b, c, d, e)

//         return pre + prepre
//     },
//     props => (props.error.message.includes("Maximum call stack") ? Infinity : NaN)
// )

// const a = () => {
//     throw new Error("sup")
// }
// const b = new Error("blabla")
// const c = [5, 6]
// const d = { a: 3 }

// d.myself = d

// const dDef = createDef({ reqProps: { a: idxDef } })
// dDef.reqProps.myself = dDef

// const A = tie(
//     "pure class A",
//     [dDef],
//     class {
//         constructor(props) {
//             this.a = props.a
//             this.b = 6
//         }
//     },
//     () => ({})
// )

// const B = tie(
//     "pure class B",
//     [dDef],
//     class extends A {
//         constructor(props) {
//             super(props)

//             this.c = props.a + 123
//         }
//     },
//     () => ({})
// )

// const e = new B(d)

// console.log(fib(500000, a, b, c, d, e))
// console.log(fib(500000, a, b, c, d, e))
// console.log(fib(4000, a, b, c, d, e))
// console.log(fib(4000, a, b, c, d, e))

// // Change the import to index.cjs.js
// // Args validation takes its toll on time!
// changeOptions({ shouldValidate: false })
// console.time("fib")
// fib(4000, a, b, c, d, e) // around 13ms is normal for 4000
// console.timeEnd("fib")

// const asyncGen = tie(
//     "pure asynchronous generator function test",
//     [idxDef],
//     async function* (i) {
//         yield i
//         await new Promise(resolve => {
//             setTimeout(resolve, 1000)
//         })
//         // throw new Error("intended")
//         return i + 10
//     },
//     () => NaN
// )

// ;(async () => {
//     const g1 = asyncGen(10)
//     console.log(await g1.next())
//     console.log(await g1.next())
//     console.log(await g1.next())

//     const g2 = asyncGen(10)
//     console.log(await g2.next())
// })()

// const gen = tie(
//     "pure generator function test",
//     [idxDef],
//     function* (i) {
//         yield i
//         // throw new Error("intended")
//         return i + 10
//     },
//     () => NaN
// )

// const g1 = gen(10)
// console.log(g1.next())
// console.log(g1.next())
// console.log(g1.next())
// const g2 = gen(10)
// console.log(g2.next())

// const asyncF = tie(
//     "pure asynchronous function test",
//     [idxDef],
//     async i => {
//         // await asyncF(i + 1)
//         await new Promise(resolve => {
//             setTimeout(resolve, 1000)
//         })
//         // throw new Error("intended")
//         return i
//     },
//     () => NaN
// )

// ;(async () => {
//     console.log(await asyncF(10))
//     console.log(await asyncF(10))
// })()

// const addNumbers = tie(
//     "pure adding two numbers",
//     [idxDef, idxDef],
//     (a, b) => {
//         console.log("ran func")

//         return a + b
//     },
//     () => NaN
// )

// const addTenTo = addNumbers(10)
// const copyOfAddTenTo = addNumbers(10)

// console.log(addTenTo(5))
// console.log(copyOfAddTenTo(5))
// console.log(copyOfAddTenTo("bla"))

// changeOptions({ notify: () => {} })
// changeOptions({ typo: () => {} })
// changeOptions({ errorLogger: 5, notify: () => {} })
// changeOptions({ errorLogger: console.error, notify: 5 })
// changeOptions("blabla")

// const retryFunc = tie(
//     "retry function",
//     [idxDef],
//     n => {
//         // if (n < 10000) {
//         if (n < 10) {
//             throw new Error("Test Error")
//         } else {
//             return n
//         }
//     },
//     props => {
//         const n = props.args[0]

//         return retryFunc(n + 1)
//     }
// )

// const parentFunc = tie(
//     "parent function",
//     [],
//     () => console.log(retryFunc(1)),
//     () => {}
// )

// parentFunc()
// console.log("ran after parentFunc")
