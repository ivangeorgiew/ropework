import { createFunc, tieValidate } from "../utils/createFunc"

export const tieImpure = createFunc(
    "tying up impure function",
    () => () => {},
    (descr, onError, func) => {
        tieValidate(descr, onError, func)

        return createFunc(descr, onError, func, false)
    }
)

export const tiePure = createFunc(
    "tying up pure function",
    () => () => {},
    (descr, onError, func) => {
        tieValidate(descr, onError, func)

        return createFunc(descr, onError, func, true)
    }
)

export const tieTimeout = createFunc(
    "creating tied setTimeout",
    () => {},
    (descr, onError, func, delay, ...args) => {
        tieValidate(descr, onError, func)

        return setTimeout(tieImpure(descr, onError, func), delay, ...args)
    }
)

export const tieInterval = createFunc(
    "creating tied setInterval",
    () => {},
    (descr, onError, func, delay, ...args) => {
        tieValidate(descr, onError, func)

        return setInterval(tieImpure(descr, onError, func), delay, ...args)
    }
)
