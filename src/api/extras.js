import { createFunc } from "../utils/createFunc"
import { handledFuncs } from "../utils/createFuncHelpers"
import { options, optsKeysGetMsg } from "../utils/innerConstants"
import { createDef, funcDef } from "./definitions"

const optionsKeys = Object.keys(options)

const optionsDef = createDef({
    getMsg: arg => optsKeysGetMsg(arg, optionsKeys),
    props: optionsKeys.reduce((acc, key) => {
        if (typeof options[key] === "function") {
            acc[key] = funcDef
        }

        return acc
    }, {}),
})

export const changeOptions = createFunc(
    "changing global options",
    [optionsDef],
    () => {},
    props => {
        Object.keys(props).forEach(key => {
            options[key] = props[key]
        })
    }
)

export const clearCacheOf = createFunc(
    "clear cache of a tied function",
    [funcDef],
    () => {},
    tiedFunc => {
        if (handledFuncs.has(tiedFunc)) {
            const { cacheKeys, cacheValues } = handledFuncs.get(tiedFunc)

            cacheKeys.length = cacheValues.length = 0
        }
    }
)

export const getPropsOf = createFunc(
    "getting props of a tied function",
    [funcDef],
    () => ({}),
    tiedFunc => {
        if (handledFuncs.has(tiedFunc)) {
            return handledFuncs.get(tiedFunc)
        }

        return {}
    }
)
