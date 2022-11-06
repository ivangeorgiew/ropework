import { options, optsKeysGetMsg } from "../utils/innerConstants"
import { handledFuncs } from "../utils/tyingHelpers"
import { boolDef, createDef, funcDef } from "./definitions"
import { tie } from "./tying"

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
    onCatch: () => {},
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
    onCatch: () => {},
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
