// const {
//     tiePure,
//     changeOptions,
//     globalHandleErrors,
//     checkIdx,
//     checkNotNil,
//     validateArgs,
// } = require("../dist/test.cjs.js")
// globalHandleErrors(true)
// changeOptions({ errorLogger: console.error, notify: () => {} })

// const fibSpec = [
//     [checkIdx, "must be positive int or 0"],
//     [checkNotNil, "must not be undefined"],
//     [checkNotNil, "must not be undefined"],
//     [checkNotNil, "must not be undefined"],
//     [checkNotNil, "must not be undefined"],
//     [checkNotNil, "must not be undefined"],
// ]

// const fib = tiePure(
//     "calculating fibonacci number",
//     () => "Not a number",
//     (n, a, b, c, d, e) => {
//         validateArgs(fibSpec, [n, a, b, c, d, e])

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

// const ASpec = [{ a: [checkNotNil, "must not be undefined"] }]
// const A = tiePure(
//     "class A",
//     () => ({}),
//     class {
//         constructor(props) {
//             validateArgs(ASpec, [props])

//             const { a } = props
//             this.a = a
//             this.b = 6
//         }
//     }
// )

// const BSpec = [{ ...ASpec[0], c: [checkNotNil, "must not be undefined"] }]
// const B = tiePure(
//     "class B",
//     () => ({}),
//     class extends A {
//         constructor(props) {
//             validateArgs(BSpec, [props])

//             const { a, c } = props
//             super({ a })
//             this.c = c
//         }
//     }
// )

// const e = new B({ a: 3, c: true })

// console.log(fib(500000, a, b, c, d, e))
// console.log(fib(500000, a, b, c, d, e))
// console.log(fib(4000, a, b, c, d, e))
// console.log(fib(4000, a, b, c, d, e))

// const numSpec = [[checkIdx, "must be positive int or 0"]]

// const asyncGen = tiePure(
//     "asynchronous generator function test",
//     () => 123,
//     async function* (i) {
//         validateArgs(numSpec, [i])

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
//         validateArgs(numSpec, [i])

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
//         validateArgs(numSpec, [i])

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
//     // console.log("\nafter the errors")

//     const a = await asyncF(10)
//     console.log(a)
//     console.log(asyncF(10))
//     const b = await asyncF(10)
//     console.log(b)
//     console.log(asyncF(10))
// })()

// const addNumbersSpec = [numSpec[0], numSpec[0]]
// const addNumbers = tiePure(
//     "adding two numbers",
//     () => "There was an error",
//     (a, b) => {
//         console.log("ran func")
//         validateArgs(addNumbersSpec, [a, b])

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

// changeOptions({ errorLogger: 5, notify: () => {} })
// changeOptions({ errorLogger: console.error, notify: 5 })
// changeOptions({ typo: () => {} })
// changeOptions("blabla")
