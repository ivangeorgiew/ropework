import { createFunc } from '../utils/createFunc'
import { isFunc, isStr, or } from './validating'

const fst = 'First argument must be the description string'
const snd = 'Second argument must be the function called on error'
const trd = 'Third argument must be the main function'

export const tieEff = createFunc(
    'tying up function with side-effects',
    () => () => {},
    (descr, onError, func) => {
        or(isStr(descr), TypeError(fst))
        or(isFunc(onError), TypeError(snd))
        or(isFunc(func), TypeError(trd))

        return createFunc(descr, onError, func, false)
    }
)

export const tiePure = createFunc(
    'tying up pure function',
    () => () => {},
    (descr, onError, func) => {
        or(isStr(descr), TypeError(fst))
        or(isFunc(onError), TypeError(snd))
        or(isFunc(func), TypeError(trd))

        return createFunc(descr, onError, func, true)
    }
)

export const tieTimeout = createFunc(
    'creating tied setTimeout',
    () => {},
    (descr, onError, func, delay, ...args) =>
        setTimeout(tieEff(descr, onError, func), delay, ...args)
)

export const tieInterval = createFunc(
    'creating tied setInterval',
    () => {},
    (descr, onError, func, delay, ...args) =>
        setInterval(tieEff(descr, onError, func), delay, ...args)
)
