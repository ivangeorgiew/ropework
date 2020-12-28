const tiedPants = require('./source')
const { tieUp, FriendlyError } = tiedPants({ isDevelopment: true })

const fib = tieUp(
    'calculating fibonacci number',
    function(n, a, b, c, d, e) {
        if (n < 0 || Math.trunc(n) !== n)
            throw new FriendlyError('The passed input wasnt possitive number')

        return n <= 1 ? n : fib.call(this, n-1, a, b, c, d, e) + fib.call(this, n-2, a, b, c, d, e)
    },
    { useCache: ([n]) => [n], onCatch: () => 0 }
)

const measureFib = tieUp(
    function(n, a, b, c, d, e) {
        const startTime = Date.now()

        try {
            return fib.call(this, n, a, b, c, d, e)
        } finally {
            console.log(`execution time ${Date.now() - startTime}ms`)
        }
    },
    { onCatch: () => 'Incorrect fibonacchi calculation' }
)

const a = () => { throw new Error('sup') }
const b = new Error('blabla')
const c = [5, 6]
const d = { b: 6, a }

d.myself = d

const A = tieUp(
    'class A',
    class {
        constructor({ a }) {
            this.a = a
            this.b = 6
        }

        someMethod() {
            throw new Error('intentional error')
            return 'sup'
        }

        someMethodOnCatch() {
            return 5
        }
    }
)

const B = tieUp(
    'class B',
    class extends A {
        constructor({ a, b }) {
            super(arguments)
            this.b = b
        }

        otherMethod() {
            throw new Error('other error')
            return 'bla'
        }

        otherMethodOnCatch() {
            return 10
        }
    }
)


console.log(measureFib.call(c, 2300, a, b, c, d, B))
console.log(measureFib.call(c, 2300, a, b, c, d, B))
// console.log(fib.name)

// for (i = 1; i <= 5; i++) {
//     console.log(measureFib(i*1000, 5, 5, 5, 5))
// }

// const e = new B({ a: 123 })
// console.log(e.someMethod())
// console.log(e.otherMethod())

// const asyncGen = tieUp(
//     'Asynchronous generator function test',
//     async function * (i) {
//         yield i
//         await new Promise((resolve) => setTimeout(resolve, 1000))
//         yield i + 10
//     }
// )
// const rag = asyncGen(10)

// rag.next().then(res => {
//     console.log(res.value)

//     rag.next().then(res => {
//         console.log(res.value)
//     })
// })

// const gen = tieUp(
//     'Generator function test',
//     function * (i) {
//         yield i
//         yield i + 10
//     }
// )
// const rg = gen(10)
// const rg2 = gen(10)

// console.log(gen(10).next().value)
// console.log(gen(10).next().value)

// const asyncF = tieUp(
//     'Asynchronous function test',
//     async function (i) {
//         await new Promise((resolve) => setTimeout(resolve, 1000))
//         return i
//     },
//     { useCache: args => args }
// )

// asyncF(10).then(res => {
//     console.log(res)
//     asyncF(10).then(res => { console.log(res) })
// })

// const loopAsync = tieUp(
//     'cached loop async function',
//     (fn, n) => new Promise((resolve, reject) => {
//         let v

//         for (let i = 0; i < n; i++) {
//             v = fn(i)
//         }

//         resolve(v)
//     }),
//     { useCache: args => args, onCatch: () => new Promise() }
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
