import { createFunc, tieSpec } from "../utils/createFunc"

export const tieImpure = createFunc(
    "tying up impure function",
    tieSpec,
    () => () => {},
    (descr, spec, onError, func) => createFunc(descr, spec, onError, func, false)
)

export const tiePure = createFunc(
    "tying up pure function",
    tieSpec,
    () => () => {},
    (descr, spec, onError, func) => createFunc(descr, spec, onError, func, true)
)

export const tieTimeout = createFunc(
    "creating tied setTimeout",
    tieSpec,
    () => {},
    (descr, spec, onError, func, delay, ...args) =>
        setTimeout(tieImpure(descr, spec, onError, func), delay, ...args)
)

export const tieInterval = createFunc(
    "creating tied setInterval",
    tieSpec,
    () => {},
    (descr, spec, onError, func, delay, ...args) =>
        setInterval(tieImpure(descr, spec, onError, func), delay, ...args)
)
