import { createFunc, tieSpec } from "../utils/createFunc"
import { idxDef } from "./definitions"

export const tieImpure = createFunc(
    "tying up impure function",
    tieSpec,
    (descr, spec, func, onError) => createFunc(descr, spec, func, onError, false),
    () => () => {}
)

export const tiePure = createFunc(
    "tying up pure function",
    tieSpec,
    (descr, spec, func, onError) => createFunc(descr, spec, func, onError, true),
    () => () => {}
)

export const tieTimeout = createFunc(
    "creating tied setTimeout",
    [...tieSpec, idxDef],
    (descr, spec, func, onError, delay, ...args) =>
        setTimeout(tieImpure(descr, spec, func, onError), delay, ...args),
    () => {}
)

export const tieInterval = createFunc(
    "creating tied setInterval",
    [...tieSpec, idxDef],
    (descr, spec, func, onError, delay, ...args) =>
        setInterval(tieImpure(descr, spec, func, onError), delay, ...args),
    () => {}
)
