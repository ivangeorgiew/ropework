import { createFunc } from '../utils/createFunc'

const one = new TypeError('First argument must be the description string')
const two = new TypeError('Second argument must be the function called on error')
const three = new TypeError('Third argument must be the main function')

const tie = createFunc(
    'tying up a function',
    () => () => {},
    function (descr, onError, func, shouldCache) {
        if (typeof descr !== 'string') return one
        if (typeof onError !== 'function') return two
        if (typeof func !== 'function') return three

        return createFunc(descr, onError, func, shouldCache)
    }
)

export const tieEff = createFunc(
    'tying up function with side-effects',
    () => () => {},
    function (descr, onError, func) {
        const result = tie(descr, onError, func, false)

        if (typeof result !== 'function') throw result

        return result
    }
)

export const tiePure = createFunc(
    'tying up pure function',
    () => () => {},
    function (descr, onError, func) {
        const result = tie(descr, onError, func, true)

        if (typeof result !== 'function') throw result

        return result
    }
)

const tiePart = createFunc(
    'tying up a partial function',
    () => () => {},
    function (descr, onError, func, shouldCache) {
        if (typeof descr !== 'string') return one
        if (typeof onError !== 'function') return two
        if (typeof func !== 'function') return three

        return tiePure(
            `partially ${descr}`,
            () => onError,
            function (...args) {
                const innerFunc = func.apply(this, args)

                if (typeof innerFunc !== 'function') {
                    throw new TypeError(
                        'The partial function has to return a function'
                    )
                }

                const creator = shouldCache ? tiePure : tieEff

                return creator(descr, onError, innerFunc)
            }
        )
    }
)

export const tieEffPart = createFunc(
    'tying up partial function with side-effects',
    () => () => {},
    function (descr, onError, func) {
        const result = tiePart(descr, onError, func, false)

        if (typeof result !== 'function') throw result

        return result
    }
)

export const tiePurePart = createFunc(
    'tying up pure partial function',
    () => () => {},
    function (descr, onError, func) {
        const result = tiePart(descr, onError, func, true)

        if (typeof result !== 'function') throw result

        return result
    }
)

export const tieTimeout = createFunc(
    'creating tied setTimeout',
    () => {},
    function (descr, onError, func, delay, ...args) {
        return setTimeout(tieEff(descr, onError, func), delay, ...args)
    }
)

export const tieInterval = createFunc(
    'creating tied setInterval',
    () => {},
    function (descr, onError, func, delay, ...args) {
        return setInterval(tieEff(descr, onError, func), delay, ...args)
    }
)
