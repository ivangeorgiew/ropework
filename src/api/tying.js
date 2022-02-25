import { createFunc, tieSpec } from "../utils/createFunc"
import { idxDef } from "./definitions"

export const tieImpure = createFunc(
    "tying up impure function",
    tieSpec,
    (descr, spec, onTry, onCatch) => createFunc(descr, spec, onTry, onCatch, false),
    () => () => {}
)

export const tiePure = createFunc(
    "tying up pure function",
    tieSpec,
    (descr, spec, onTry, onCatch) => createFunc(descr, spec, onTry, onCatch, true),
    () => () => {}
)

export const tieTimeout = createFunc(
    "creating tied setTimeout",
    [...tieSpec, idxDef],
    (descr, spec, onTry, onCatch, delay, ...args) =>
        setTimeout(tieImpure(descr, spec, onTry, onCatch), delay, ...args),
    () => {}
)

export const tieInterval = createFunc(
    "creating tied setInterval",
    [...tieSpec, idxDef],
    (descr, spec, onTry, onCatch, delay, ...args) =>
        setInterval(tieImpure(descr, spec, onTry, onCatch), delay, ...args),
    () => {}
)
