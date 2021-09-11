import { createFunc } from "../utils/createFunc"
import { handledFuncs } from "../utils/createFuncHelpers"
import { options } from "../utils/generics"
import { createDef, funcDef, objDef } from "./definitions"

const optionsDef = createDef({
    getMsg: objDef.getMsg,
    props: { errorLogger: funcDef, notify: funcDef },
})

export const changeOptions = createFunc(
    "changing global options",
    [optionsDef],
    () => {},
    props => {
        Object.keys(props).forEach(key => {
            if (key in options) {
                options[key] = props[key]
            }
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
