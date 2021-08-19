import { createFunc } from '../utils/createFunc'

const fst = new TypeError('First argument must be the description string')
const snd = new TypeError('Second argument must be the function called on error')
const trd = new TypeError('Third argument must be the main function')

export const tieEff = createFunc(
    'tying up function with side-effects',
    () => () => {},
    function (descr, onError, func) {
        if (typeof descr !== 'string') throw fst
        if (typeof onError !== 'function') throw snd
        if (typeof func !== 'function') throw trd

        return createFunc(descr, onError, func, false)
    }
)

export const tiePure = createFunc(
    'tying up pure function',
    () => () => {},
    function (descr, onError, func) {
        if (typeof descr !== 'string') throw fst
        if (typeof onError !== 'function') throw snd
        if (typeof func !== 'function') throw trd

        return createFunc(descr, onError, func, true)
    }
)

const tiePart = createFunc(
    'tying up a partial function',
    () => () => {},
    function (descr, onError, func, shouldCache) {
        return tiePure(
            `partially ${descr}`,
            () => onError,
            function (...args) {
                const inner = func.apply(this, args)

                if (typeof inner !== 'function') {
                    throw new TypeError(
                        'The partial function has to return a function'
                    )
                }

                const creator = shouldCache ? tiePure : tieEff

                return creator(descr, onError, inner)
            }
        )
    }
)

export const tieEffPart = createFunc(
    'tying up partial function with side-effects',
    () => () => {},
    function (descr, onError, func) {
        if (typeof descr !== 'string') throw fst
        if (typeof onError !== 'function') throw snd
        if (typeof func !== 'function') throw trd

        return tiePart(descr, onError, func, false)
    }
)

export const tiePurePart = createFunc(
    'tying up pure partial function',
    () => () => {},
    function (descr, onError, func) {
        if (typeof descr !== 'string') throw fst
        if (typeof onError !== 'function') throw snd
        if (typeof func !== 'function') throw trd

        return tiePart(descr, onError, func, true)
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
