import { createFunc } from "../utils/createFunc"
import { handledFuncs } from "../utils/createFuncHelpers"
import { options } from "../utils/helpers"
import { createDef, funcDef, objDef } from "./validating"

const optionsDefProps = { errorLogger: funcDef, notify: funcDef }
const optionsDef = createDef({
    getMsg: arg => {
        const msg = objDef.getMsg(arg)

        if (msg !== "") {
            return msg
        }

        const keys = Object.keys(arg)

        for (let i = 0; i < keys.length; i++) {
            if (!(keys[i] in optionsDefProps)) {
                return `there is no option with key ${keys[i]}`
            }
        }

        return ""
    },
    props: optionsDefProps,
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
