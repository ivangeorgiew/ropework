import { createFunc } from "../utils/createFunc"
import { handledFuncs } from "../utils/createFuncHelpers"
import { options } from "../utils/helpers"
import { createDef, funcDef, objDef } from "./validating"

const optionsDef = createDef({
    getMsg: arg => {
        const msg = objDef.getMsg(arg)

        if (msg !== "") {
            return msg
        }

        const keys = Object.keys(arg)

        for (let i = 0; i < keys.length; i++) {
            if (!(keys[i] in options)) {
                return `there is no option "${keys[i]}"`
            }
        }

        return ""
    },
    props: Object.keys(options).reduce((acc, key) => {
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

export const getArgsOf = createFunc(
    "getting arguments of a tied function",
    [funcDef],
    () => ({}),
    tiedFunc => {
        if (handledFuncs.has(tiedFunc)) {
            const props = handledFuncs.get(tiedFunc)

            return {
                descr: props.descr,
                spec: props.spec,
                onError: props.onError,
                func: props.func,
            }
        }

        return {}
    }
)
