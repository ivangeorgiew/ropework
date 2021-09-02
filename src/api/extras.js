import { createFunc } from "../utils/createFunc"
import { handledFuncs, options } from "../utils/helpers"
import { checkFunc, checkObj, or } from "./validating"

export const changeOptions = createFunc(
    "changing global options",
    () => {},
    props => {
        or(checkObj(props), TypeError("You must pass an object"))

        Object.keys(props).forEach(key => {
            or(key in options, TypeError(`Key "${key}" is not valid option`))
            or(
                typeof props[key] === typeof options[key],
                TypeError(
                    `Value of "${key}" has to have type ${typeof options[key]}`
                )
            )

            options[key] = props[key]
        })
    }
)

export const clearCacheFor = createFunc(
    "clear cache for a tied function",
    () => {},
    func => {
        or(checkFunc(func), TypeError("You must pass a function"))

        if (handledFuncs.has(func)) {
            const { cacheKeys, cacheValues } = handledFuncs.get(func)

            cacheKeys.length = cacheValues.length = 0
        }
    }
)
