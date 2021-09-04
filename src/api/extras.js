import { createFunc } from "../utils/createFunc"
import { handledFuncs } from "../utils/createFuncHelpers"
import { options } from "../utils/helpers"
import { checkNil, createValidator, funcDef } from "./validating"

const changeOptionsSpec = [
    {
        errorLogger: [
            arg => typeof arg === "function" || checkNil(arg),
            "must be function or undefined",
        ],
        notify: [
            arg => typeof arg === "function" || checkNil(arg),
            "must be function or undefined",
        ],
    },
]
const changeOptionsValidate = createValidator(changeOptionsSpec)

export const changeOptions = createFunc(
    "changing global options",
    () => {},
    props => {
        changeOptionsValidate(props)

        Object.keys(props).forEach(key => {
            if (!(key in options)) {
                throw Error(`There is no option "${key}"`)
            }

            if (!checkNil(props[key])) {
                options[key] = props[key]
            }
        })
    }
)

const clearCacheForSpec = [funcDef]
const clearCacheForValidate = createValidator(clearCacheForSpec)

export const clearCacheFor = createFunc(
    "clear cache for a tied function",
    () => {},
    func => {
        clearCacheForValidate(func)

        if (handledFuncs.has(func)) {
            const { cacheKeys, cacheValues } = handledFuncs.get(func)

            cacheKeys.length = cacheValues.length = 0
        }
    }
)
