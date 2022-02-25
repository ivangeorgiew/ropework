import { createFunc, tieSpec } from "../utils/createFunc"
import { idxDef } from "./definitions"

export const tieImpure = createFunc({
    descr: "tying up impure function",
    spec: tieSpec,
    onTry: props => createFunc({ ...props, isPure: false }),
    onCatch: () => () => {},
})

export const tiePure = createFunc({
    descr: "tying up pure function",
    spec: tieSpec,
    onTry: props => createFunc({ ...props, isPure: true }),
    onCatch: () => () => {},
})

export const tieTimeout = createFunc({
    descr: "creating tied setTimeout",
    spec: [...tieSpec, idxDef],
    onTry: (props, delay, ...args) => setTimeout(tieImpure(props), delay, ...args),
    onCatch: () => -1,
})

export const tieInterval = createFunc({
    descr: "creating tied setInterval",
    spec: [...tieSpec, idxDef],
    onTry: (props, delay, ...args) => setInterval(tieImpure(props), delay, ...args),
    onCatch: () => -1,
})
