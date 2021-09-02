import { createFunc } from "../utils/createFunc"
import { checkFunc, checkStr, validateArgs } from "./validating"

const tieSpec = [
    [checkStr, "First argument must be the description string"],
    [checkFunc, "Second argument must be the function called on error"],
    [checkFunc, "Third argument must be the main function"],
]

export const tieImpure = createFunc(
    "tying up impure function",
    () => () => {},
    (descr, onError, func) => {
        validateArgs(tieSpec, [descr, onError, func])

        return createFunc(descr, onError, func, false)
    }
)

export const tiePure = createFunc(
    "tying up pure function",
    () => () => {},
    (descr, onError, func) => {
        validateArgs(tieSpec, [descr, onError, func])

        return createFunc(descr, onError, func, true)
    }
)

export const tieTimeout = createFunc(
    "creating tied setTimeout",
    () => {},
    (descr, onError, func, delay, ...args) => {
        validateArgs(tieSpec, [descr, onError, func])

        return setTimeout(tieImpure(descr, onError, func), delay, ...args)
    }
)

export const tieInterval = createFunc(
    "creating tied setInterval",
    () => {},
    (descr, onError, func, delay, ...args) => {
        validateArgs(tieSpec, [descr, onError, func])

        return setInterval(tieImpure(descr, onError, func), delay, ...args)
    }
)
