import { createFunc } from "../utils/createFunc"
import { handledFuncs } from "../utils/createFuncHelpers"
import { options } from "../utils/helpers"
import { checkFunc, checkObj, orThrow, validateArgs } from "./validating"

const changeOptionsSpec = [[checkObj, "must be object"]]

export const changeOptions = createFunc(
    "changing global options",
    () => {},
    props => {
        validateArgs(changeOptionsSpec, [props])

        Object.keys(props).forEach(key => {
            orThrow(key in options, `Key "${key}" is not valid option`)
            orThrow(
                typeof props[key] === typeof options[key],
                `Value of "${key}" has to have type ${typeof options[key]}`
            )

            options[key] = props[key]
        })
    }
)

const clearCacheForSpec = [[checkFunc, "must be function"]]

export const clearCacheFor = createFunc(
    "clear cache for a tied function",
    () => {},
    func => {
        validateArgs(clearCacheForSpec, [func])

        if (handledFuncs.has(func)) {
            const { cacheKeys, cacheValues } = handledFuncs.get(func)

            cacheKeys.length = cacheValues.length = 0
        }
    }
)
