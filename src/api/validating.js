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

export const or = (isValid, error) => {
    if (typeof isValid !== "boolean") {
        throw TypeError("First arg of [or] must be boolean")
    }

    if (!(error instanceof Error)) {
        throw TypeError("Second arg of [or] must be instanceof Error")
    }

    if (!isValid) {
        throw error
    }
}
