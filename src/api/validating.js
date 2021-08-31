export const isStr = val => typeof val === "string"
export const isNum = val => typeof val === "number"
export const isInt = val => Number.isInteger(val) && Number.isFinite(val)
export const isBigInt = val => typeof val === "bigint"
export const isBool = val => typeof val === "boolean"
export const isSym = val => typeof val === "symbol"
export const isNil = val => val === undefined || val === null
export const isFunc = val => typeof val === "function"
export const isArr = val => Array.isArray(val)
export const isObj = val => !isNil(val) && typeof val === "object" && !isArr(val)

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
