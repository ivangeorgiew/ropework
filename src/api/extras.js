import { createFunc } from "../utils/createFunc"
import { handledFuncs } from "../utils/createFuncHelpers"
import { options, optsKeysGetMsg } from "../utils/innerConstants"
import { boolDef, createDef, funcDef } from "./definitions"

const optionsDef = createDef({
    getMsg: arg => optsKeysGetMsg(arg, Object.keys(options)),
    props: {
        errorLogger: funcDef,
        notify: funcDef,
        shouldValidate: boolDef,
    },
})

export const changeOptions = createFunc({
    descr: "changing global options",
    spec: [optionsDef],
    onTry: props => {
        Object.keys(props).forEach(key => {
            options[key] = props[key]
        })
    },
})

export const clearCacheOf = createFunc({
    descr: "clear cache of a tied function",
    spec: [funcDef],
    onTry: tiedFunc => {
        if (handledFuncs.has(tiedFunc)) {
            const { cacheKeys, cacheValues } = handledFuncs.get(tiedFunc)

            cacheKeys.length = cacheValues.length = 0
        }
    },
})

export const getPropsOf = createFunc({
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
