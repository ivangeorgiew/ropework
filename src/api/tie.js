import { createFunc } from '../utils/createFunc'

const one = new TypeError('First argument must be the description string')
const two = new TypeError('Second argument must be the function called on error')
const three = new TypeError('Third argument must be the main function')

export const tieEff = createFunc(
    'tying up function with side-effects',
    () => () => {},
    function (descr, onError, func) {
        if (typeof descr !== 'string') throw one
        if (typeof onError !== 'function') throw two
        if (typeof func !== 'function') throw three

        return createFunc(descr, onError, func, false)
    }
)

export const tiePure = createFunc(
    'tying up pure function',
    () => () => {},
    function (descr, onError, func) {
        if (typeof descr !== 'string') throw one
        if (typeof onError !== 'function') throw two
        if (typeof func !== 'function') throw three

        return createFunc(descr, onError, func, true)
    }
)
