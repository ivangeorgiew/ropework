// const {
//     tiePure,
//     changeOptions,
//     handleGlobalErrors,
//     idxDef,
//     definedDef,
//     createDef,
// } = require("../dist/index.cjs.test.js")

// handleGlobalErrors(true)

// const fib = tiePure({
//     descr: "calculating fibonacci number",
//     spec: [idxDef, definedDef, definedDef, definedDef, definedDef, definedDef],
//     onTry: (n, a, b, c, d, e) => {
//         if (n <= 1) return n

//         const pre = fib(n - 2, a, b, c, d, e)
//         const prepre = fib(n - 1, a, b, c, d, e)

//         return pre + prepre
//     },
//     onCatch: () => NaN,
// })

// const a = () => {
//     throw new Error("sup")
// }
// const b = new Error("blabla")
// const c = [5, 6]
// const d = { a: 3 }

// d.myself = d

// const dDef = createDef({ strictProps: { a: idxDef } })
// dDef.strictProps.myself = dDef

// const A = tiePure({
//     descr: "class A",
//     spec: [dDef],
//     onTry: class {
//         constructor(props) {
//             this.a = props.a
//             this.b = 6
//         }
//     },
//     onCatch: () => ({}),
// })

// const B = tiePure({
//     descr: "class B",
//     spec: [dDef],
//     onTry: class extends A {
//         constructor(props) {
//             super(props)

//             this.c = props.a + 123
//         }
//     },
//     onCatch: () => ({}),
// })

// const e = new B(d)

// console.log(fib(500000, a, b, c, d, e))
// console.log(fib(500000, a, b, c, d, e))
// console.log(fib(4000, a, b, c, d, e))
// console.log(fib(4000, a, b, c, d, e))

// // Args validation takes its toll on time!
// // CHANGE IMPORT TO: "../dist/index.cjs.prod.js"
// console.time("fib")
// fib(4000, a, b, c, d, e) // around 13ms is normal for 4000
// console.timeEnd("fib")

// const asyncGen = tiePure({
//     descr: "asynchronous generator function test",
//     spec: [idxDef],
//     onTry: async function* (i) {
//         yield i
//         await new Promise(resolve => {
//             setTimeout(resolve, 1000)
//         })
//         // throw new Error("intended")
//         return i + 10
//     },
//     onCatch: () => NaN,
// })

// ;(async () => {
//     const g1 = asyncGen(10)
//     console.log(await g1.next())
//     console.log(await g1.next())
//     console.log(await g1.next())

//     const g2 = asyncGen(10)
//     console.log(await g2.next())
// })()

// const gen = tiePure({
//     descr: "generator function test",
//     spec: [idxDef],
//     onTry: function* (i) {
//         yield i
//         // throw new Error("intended")
//         return i + 10
//     },
//     onCatch: () => NaN,
// })

// const g1 = gen(10)
// console.log(g1.next())
// console.log(g1.next())
// console.log(g1.next())
// const g2 = gen(10)
// console.log(g2.next())

// const asyncF = tiePure({
//     descr: "asynchronous function test",
//     spec: [idxDef],
//     onTry: async i => {
//         // await asyncF(i + 1)
//         await new Promise(resolve => {
//             setTimeout(resolve, 1000)
//         })
//         // throw new Error("intended")
//         return i
//     },
//     onCatch: () => NaN,
// })

// ;(async () => {
//     console.log(await asyncF(10))
//     console.log(await asyncF(10))
// })()

// const addNumbers = tiePure({
//     descr: "adding two numbers",
//     spec: [idxDef, idxDef],
//     onTry: (a, b) => {
//         console.log("ran func")

//         return a + b
//     },
//     onCatch: () => NaN,
// })

// const addSupTo = addNumbers("sup")
// const addTenTo = addNumbers(10)
// const copyOfAddTenTo = addNumbers(10)

// console.log(addSupTo(5))
// console.log(addTenTo(5))
// console.log(copyOfAddTenTo(5))
// console.log(copyOfAddTenTo("bla"))

// changeOptions({ notify: () => {} })
// changeOptions({ typo: () => {} })
// changeOptions({ errorLogger: 5, notify: () => {} })
// changeOptions({ errorLogger: console.error, notify: 5 })
// changeOptions("blabla")

// const retryFunc = tiePure({
//     descr: "retry function",
//     spec: [idxDef],
//     onTry: n => {
//         // if (n < 10000) {
//         if (n < 10) {
//             throw Error("Test Error")
//         } else {
//             return n
//         }
//     },
//     onCatch: props => {
//         const { args } = props
//         const [n] = args

//         return retryFunc(n + 1)
//     },
// })

// console.log(retryFunc(1))
