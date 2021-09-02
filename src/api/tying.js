import { createFunc } from "../utils/createFunc"
import { checkFunc, checkStr, or } from "./validating"

const fst = "First argument must be the description string"
const snd = "Second argument must be the function called on error"
const trd = "Third argument must be the main function"

export const tieImpure = createFunc(
    "tying up impure function",
    () => () => {},
    (descr, onError, func) => {
        or(checkStr(descr), TypeError(fst))
        or(checkFunc(onError), TypeError(snd))
        or(checkFunc(func), TypeError(trd))

        return createFunc(descr, onError, func, false)
    }
)

export const tiePure = createFunc(
    "tying up pure function",
    () => () => {},
    (descr, onError, func) => {
        or(checkStr(descr), TypeError(fst))
        or(checkFunc(onError), TypeError(snd))
        or(checkFunc(func), TypeError(trd))

        return createFunc(descr, onError, func, true)
    }
)

export const tieTimeout = createFunc(
    "creating tied setTimeout",
    () => {},
    (descr, onError, func, delay, ...args) =>
        setTimeout(tieImpure(descr, onError, func), delay, ...args)
)

export const tieInterval = createFunc(
    "creating tied setInterval",
    () => {},
    (descr, onError, func, delay, ...args) =>
        setInterval(tieImpure(descr, onError, func), delay, ...args)
)
