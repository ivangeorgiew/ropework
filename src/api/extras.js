import { options, optsKeysGetMsg } from "../utils/innerConstants"
import { handledFuncs } from "../utils/tyingHelpers"
import { boolDef, createDef, funcDef, idxDef } from "./definitions"
import { tie, tieSpec } from "./tying"

const optionsDef = createDef({
    getMsg: arg => optsKeysGetMsg(arg, Object.keys(options)),
    props: {
        errorLogger: funcDef,
        notify: funcDef,
        shouldValidate: boolDef,
    },
})

export const changeOptions = tie({
    descr: "changing global options",
    spec: [optionsDef],
    onTry: props => {
        Object.keys(props).forEach(key => {
            options[key] = props[key]
        })
    },
    onCatch: () => null,
})

export const clearCacheOf = tie({
    descr: "clear cache of a tied function",
    spec: [funcDef],
    onTry: tiedFunc => {
        if (handledFuncs.has(tiedFunc)) {
            const { cacheKeys, cacheValues } = handledFuncs.get(tiedFunc)

            cacheKeys.length = cacheValues.length = 0
        }
    },
    onCatch: () => null,
})

export const getPropsOf = tie({
    descr: "getting props of a tied function",
    spec: [funcDef],
    onTry: tiedFunc => {
        if (handledFuncs.has(tiedFunc)) {
            return handledFuncs.get(tiedFunc)
        }

        return {}
    },
    onCatch: () => ({}),
})

export const tieTimeout = tie({
    descr: "creating tied setTimeout",
    spec: [...tieSpec, idxDef],
    onTry: (props, delay, ...args) => setTimeout(tie(props), delay, ...args),
    onCatch: () => -1,
})

export const tieInterval = tie({
    descr: "creating tied setInterval",
    spec: [...tieSpec, idxDef],
    onTry: (props, delay, ...args) => setInterval(tie(props), delay, ...args),
    onCatch: () => -1,
})
