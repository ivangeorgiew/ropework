import { createFunc } from "../utils/createFunc"
import { options } from "../utils/helpers"
import { isObj, or } from "./validating"

export const changeOptions = createFunc(
    "changing global options",
    () => {},
    props => {
        or(isObj(props), TypeError("You must pass an object"))

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
