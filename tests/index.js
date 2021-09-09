// const {
//     tiePure,
//     changeOptions,
//     globalHandleErrors,
//     idxDef,
//     definedDef,
//     objDef,
//     createDef,
// } = require("../dist/test.cjs.js")

// globalHandleErrors(true)

// const fib = tiePure(
//     "calculating fibonacci number",
//     [idxDef, definedDef, definedDef, definedDef, definedDef, definedDef],
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
// const d = { a: 3 }

// d.myself = d

// const dDef = createDef({ ...objDef, strictProps: { a: idxDef } })
// dDef.strictProps.myself = dDef

// const A = tiePure(
//     "class A",
//     [dDef],
//     () => ({}),
//     class {
//         constructor(props) {
//             this.a = props.a
//             this.b = 6
//         }
//     }
// )

// const B = tiePure(
//     "class B",
//     [dDef],
//     () => ({}),
//     class extends A {
//         constructor(props) {
//             super(props)

//             this.c = props.a + 123
//         }
//     }
// )

// const e = new B(d)

// console.log(fib(500000, a, b, c, d, e))
// console.log(fib(500000, a, b, c, d, e))
// console.log(fib(4000, a, b, c, d, e))
// console.log(fib(4000, a, b, c, d, e))

// console.time("fib")
// fib(4000, a, b, c, d, e)
// console.timeEnd("fib")

// const asyncGen = tiePure(
//     "asynchronous generator function test",
//     [idxDef],
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
//     [idxDef],
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
//     [idxDef],
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
//     console.log(await asyncF(10))
//     console.log(await asyncF(10))
//     console.log("\nafter")
// })()

// const addNumbers = tiePure(
//     "adding two numbers",
//     [idxDef, idxDef],
//     () => "There was an error",
//     (a, b) => {
//         console.log("ran func")

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

// changeOptions({ notify: () => {} })
// changeOptions({ errorLogger: 5, notify: () => {} })
// changeOptions({ errorLogger: console.error, notify: 5 })
// changeOptions({ typo: () => {} })
// changeOptions("blabla")
