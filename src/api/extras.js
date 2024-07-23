import { checkObj, options } from "../utils/innerConstants"
import { handledFuncs } from "../utils/tyingHelpers"
import { boolDef, funcDef } from "./definitions"
import { tie } from "./tying"

const optionsDef = {
    getMsg: arg => {
        if (!checkObj(arg)) {
            return "must be object"
        }

        const validKeys = Object.keys(options)
        const invalidKeys = Object.keys(arg).filter(key => validKeys.indexOf(key) === -1)

        if (invalidKeys.length > 0) {
            return `has invalid keys: ${invalidKeys.join(", ")}`
        }

        return ""
    },
    optProps: {
        errorLogger: funcDef,
        notify: funcDef,
        shouldValidate: boolDef,
    },
}

export const changeOptions = tie(
    "changing global options",
    [optionsDef],
    props => {
        Object.keys(props).forEach(key => {
            options[key] = props[key]
        })
    },
    () => {}
)

export const clearCacheOf = tie(
    "clear cache of a tied function",
    [funcDef],
    tiedFunc => {
        if (handledFuncs.has(tiedFunc)) {
            const { cacheKeys, cacheValues } = handledFuncs.get(tiedFunc)

            cacheKeys.length = cacheValues.length = 0
        }
    },
    () => {}
)

export const getPropsOf = tie(
    "getting props of a tied function",
    [funcDef],
    tiedFunc => {
        if (handledFuncs.has(tiedFunc)) {
            return handledFuncs.get(tiedFunc)
        }

        return {}
    },
    () => ({})
)
