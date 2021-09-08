import { createFunc } from "../utils/createFunc"
import { handledFuncs } from "../utils/createFuncHelpers"
import { options } from "../utils/helpers"
import { funcDef, objDef } from "./validating"

const funcOrNilDef = [
    arg =>
        typeof arg === "function" || arg === undefined
            ? ""
            : "must be function or undefined",
]

const changeOptionsSpec = [
    [objDef[0], { errorLogger: funcOrNilDef, notify: funcOrNilDef }],
]

export const changeOptions = createFunc(
    "changing global options",
    changeOptionsSpec,
    () => {},
    props => {
        Object.keys(props).forEach(key => {
            if (!(key in options)) {
                throw Error(`There is no option "${key}"`)
            }

            if (props[key] !== undefined) {
                options[key] = props[key]
            }
        })
    }
)

const clearCacheForSpec = [funcDef]

export const clearCacheFor = createFunc(
    "clear cache for a tied function",
    clearCacheForSpec,
    () => {},
    func => {
        if (handledFuncs.has(func)) {
            const { cacheKeys, cacheValues } = handledFuncs.get(func)

            cacheKeys.length = cacheValues.length = 0
        }
    }
)
