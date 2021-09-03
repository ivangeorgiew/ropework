import { isTest } from "./constants"

export const checkStr = val => typeof val === "string"
export const checkNum = val => typeof val === "number"
export const checkInt = val => Number.isInteger(val) && Number.isFinite(val)
export const checkIdx = val => checkInt(val) && val >= 0
export const checkBigInt = val => typeof val === "bigint"
export const checkBool = val => typeof val === "boolean"
export const checkSym = val => typeof val === "symbol"
export const checkNil = val => val === undefined || val === null
export const checkNotNil = val => !checkNil(val)
export const checkFunc = val => typeof val === "function"
export const checkArr = val => Array.isArray(val)
export const checkObj = val =>
    !checkNil(val) && typeof val === "object" && !checkArr(val)
export const checkErrorConstr = val =>
    val === Error || Object.getPrototypeOf(val) === Error

export const orThrow = (isValid, msg, ErrorConstr) => {
    if (!checkBool(isValid)) {
        throw Error("orThrow -> arguments[0] must be boolean")
    }

    if (!checkStr(msg)) {
        throw Error("orThrow -> argumenst[1] must be string")
    }

    if (!checkNil(ErrorConstr) && !checkErrorConstr(ErrorConstr)) {
        throw Error("orThrow -> arguments[2] must be undefined or Error constructor")
    }

    const InnerError = checkNil(ErrorConstr) ? Error : ErrorConstr

    if (!isValid) {
        throw new InnerError(msg)
    }
}

export const validateArgs = (spec, args, ErrorConstr) => {
    orThrow(checkArr(spec), "validateArgs -> arguments[0] must be array")
    orThrow(checkArr(args), "validateArgs -> arguments[1] must be array")
    orThrow(
        checkNil(ErrorConstr) || checkErrorConstr(ErrorConstr),
        "validateArgs -> arguments[2] must be undefined or Error constructor"
    )

    const InnerError = checkNil(ErrorConstr) ? Error : ErrorConstr

    const validateItem = (item, idx, key) => {
        if (isTest) {
            orThrow(
                (checkArr(item) && item.length === 2) || checkObj(item),
                `validateArgs -> validateItem -> arguments[0] must be array with 2 items or object`
            )
            orThrow(
                checkIdx(idx),
                `validateArgs -> validateItem -> arguments[1] must be valid index`
            )
            orThrow(
                checkStr(key) || checkNil(key),
                `validateArgs -> validateItem -> arguments[2] must be string or undefined`
            )
        }

        const isNested = checkStr(key)
        const [getIsValid, msg] = isNested ? item[key] : item
        const extra = isNested ? `[${key}]` : ""

        orThrow(
            checkFunc(getIsValid),
            `validateArgs -> arguments[0][${idx}]${extra}[0] must be function`
        )
        orThrow(
            checkStr(msg),
            `validateArgs -> arguments[0][${idx}]${extra}[1] must be string`
        )

        const isValid = getIsValid(isNested ? args[idx][key] : args[idx])

        orThrow(
            checkBool(isValid),
            `validateArgs -> arguments[0][${idx}]${extra}[0] must return boolean`
        )

        const wholeMsg = `arguments[${idx}]${extra} - ${msg}`

        orThrow(isValid, wholeMsg, InnerError)
    }

    for (let i = 0; i < spec.length; i++) {
        const item = spec[i]

        orThrow(
            (checkArr(item) && item.length === 2) || checkObj(item),
            `validateArgs -> arguments[0][${i}] must be array with length 2 or object`
        )

        if (checkArr(item)) {
            validateItem(item, i)
        } else {
            orThrow(
                checkObj(args[i]) || checkArr(args[i]),
                `arguments[${i}] - must be object or array`
            )

            const keys = Object.keys(item)

            for (let m = 0; m < keys.length; m++) {
                validateItem(item, i, keys[m])
            }
        }
    }
}
