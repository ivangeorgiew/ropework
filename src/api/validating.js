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
        throw TypeError("First arg to [orThrow] must be boolean")
    }

    if (!checkStr(msg)) {
        throw TypeError("Second arg to [orThrow] must be string")
    }

    if (!checkNil(ErrorConstr) && !checkErrorConstr(ErrorConstr)) {
        throw TypeError(
            "Third arg to [orThrow] must be undefined or Error constructor"
        )
    }

    const InnerError = checkNil(ErrorConstr) ? Error : ErrorConstr

    if (!isValid) {
        throw new InnerError(msg)
    }
}

export const validateArgs = (spec, args, ErrorConstr) => {
    orThrow(checkArr(spec), "First arg to [validateArgs] must be array", TypeError)
    orThrow(checkArr(args), "Second arg to [validateArgs] must be array", TypeError)
    orThrow(
        checkNil(ErrorConstr) || checkErrorConstr(ErrorConstr),
        "Third arg to [validateArgs] must be undefined or Error constructor",
        TypeError
    )

    const InnerError = checkNil(ErrorConstr) ? TypeError : ErrorConstr

    for (let i = 0; i < spec.length; i++) {
        const item = spec[i]

        orThrow(
            checkArr(item) && item.length === 2,
            `validateArgs -> firstArg[${i}] must be array with 2 items`,
            InnerError
        )

        const [getIsValid, msg] = item

        orThrow(
            checkFunc(getIsValid),
            `validateArgs -> firstArg[${i}][0] must be function`,
            InnerError
        )
        orThrow(
            checkStr(msg),
            `validateArgs -> firstArg[${i}][1] must be string`,
            InnerError
        )

        const isValid = getIsValid(args[i])

        orThrow(
            checkBool(isValid),
            `validateArgs -> firstArg[${i}][0] must return boolean`,
            InnerError
        )

        orThrow(isValid, msg, InnerError)
    }
}
