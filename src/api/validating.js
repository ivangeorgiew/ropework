import { isTest } from "./constants"

export const checkStr = val => typeof val === "string"
export const checkNum = val => typeof val === "number"
export const checkInt = val => Number.isInteger(val) && Number.isFinite(val)
export const checkBigInt = val => typeof val === "bigint"
export const checkBool = val => typeof val === "boolean"
export const checkSym = val => typeof val === "symbol"
export const checkNil = val => val === undefined || val === null
export const checkFunc = val => typeof val === "function"
export const checkArr = val => Array.isArray(val)
export const checkObj = val =>
    !checkNil(val) && typeof val === "object" && !checkArr(val)
export const checkErrorConstr = val =>
    val === Error || Object.getPrototypeOf(val) === Error

export const orThrow = (isValid, msg, ErrorConstr) => {
    if (!checkBool(isValid)) {
        throw Error("First arg to [orThrow] must be boolean")
    }

    if (!checkStr(msg)) {
        throw Error("Second arg to [orThrow] must be string")
    }

    if (!checkNil(ErrorConstr) && !checkErrorConstr(ErrorConstr)) {
        throw Error("Third arg to [orThrow] must be undefined or Error constructor")
    }

    const InnerError = checkNil(ErrorConstr) ? Error : ErrorConstr

    if (!isValid) {
        throw new InnerError(msg)
    }
}

export const validateArgs = (spec, args, ErrorConstr) => {
    orThrow(checkArr(spec), "First arg to [validateArgs] must be array")
    orThrow(checkArr(args), "Second arg to [validateArgs] must be array")
    orThrow(
        checkNil(ErrorConstr) || checkErrorConstr(ErrorConstr),
        "Third arg to [validateArgs] must be undefined or Error constructor"
    )

    const InnerError = checkNil(ErrorConstr) ? Error : ErrorConstr

    const validateItem = (item, idx, key) => {
        if (isTest) {
            orThrow(
                (checkArr(item) && item.length === 2) || checkObj(item),
                `validateArgs -> validateItem -> First arg must be array with 2 items or object`
            )
            orThrow(
                checkInt(idx) && idx >= 0,
                `validateArgs -> validateItem -> Second arg must be positive integer`
            )
            orThrow(
                checkStr(key) || checkNil(key),
                `validateArgs -> validateItem -> Third arg must be string or undefined`
            )
        }

        const isNested = checkStr(key)
        const [getIsValid, msg] = isNested ? item[key] : item
        const extra = isNested ? `[${key}]` : ""

        orThrow(
            checkFunc(getIsValid),
            `validateArgs -> firstArg[${idx}]${extra}[0] must be function`
        )
        orThrow(
            checkStr(msg),
            `validateArgs -> firstArg[${idx}]${extra}[1] must be string`
        )

        const isValid = getIsValid(isNested ? args[idx][key] : args[idx])

        orThrow(
            checkBool(isValid),
            `validateArgs -> firstArg[${idx}]${extra}[0] must return boolean`
        )

        orThrow(isValid, msg, InnerError)
    }

    for (let i = 0; i < spec.length; i++) {
        const item = spec[i]

        orThrow(
            (checkArr(item) && item.length === 2) || checkObj(item),
            `validateArgs -> firstArg[${i}] must be array with 2 items or object`
        )

        if (checkArr(item)) {
            validateItem(item, i)
        } else {
            orThrow(
                checkObj(args[i]) || checkArr(args[i]),
                `Argument with index ${i} must be object or array`
            )

            const keys = Object.keys(item)

            for (let m = 0; m < keys.length; m++) {
                validateItem(item, i, keys[m])
            }
        }
    }
}
