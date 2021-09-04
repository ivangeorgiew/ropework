export const checkInt = val => Number.isInteger(val) && Number.isFinite(val)
export const checkIdx = val => checkInt(val) && val >= 0
export const checkNil = val => val === undefined || val === null
export const checkNotNil = val => !checkNil(val)
export const checkObjType = val => val !== null && typeof val === "object"
export const checkObj = val =>
    checkObjType(val) &&
    (val.constructor === Object || val.constructor === undefined)

export const checkConstr = val => {
    try {
        Reflect.construct(String, [], val)
        return true
    } catch (_e) {
        return false
    }
}

export const nilDef = [checkNil, "must be null or undefined"]
export const notNilDef = [checkNotNil, "must not be null or undefined"]
export const strDef = [val => typeof val === "string", "must be string"]
export const numDef = [val => typeof val === "number", "must be number"]
export const bigIntDef = [val => typeof val === "bigint", "must be BigInt"]
export const boolDef = [val => typeof val === "boolean", "must be boolean"]
export const symDef = [val => typeof val === "symbol", "must be Symbol"]
export const funcDef = [val => typeof val === "function", "must be function"]
export const arrDef = [Array.isArray, "must be array"]
export const objDef = [checkObj, "must be object"]
export const objTypeDef = [checkObj, "must be object type"]
export const intDef = [checkInt, "must be integer"]
export const idxDef = [checkIdx, "must be positive integer or 0"]
export const constrDef = [checkConstr, "must be constructor function"]

const checkErrorConstr = val => {
    if (val === Error) return true

    if (checkConstr(val)) {
        let curr = val

        for (let i = 0; i < 50; i++) {
            curr = Object.getPrototypeOf(curr)

            if (curr === null) return false
            if (curr === Error) return true
        }
    }

    return false
}

export const createValidatorCustom = (ErrorConstr, ...restArgs) => {
    if (!checkErrorConstr(ErrorConstr)) {
        throw TypeError(
            "createValidatorCustom -> arguments[0] must be constructor which is or extends Error"
        )
    }

    const createError = function (...args) {
        try {
            return new ErrorConstr(...args)
        } catch (_e) {
            throw TypeError(
                "createValidatorCustom -> arguments[0] throws when called with `new`"
            )
        }
    }

    const validateItem = props => {
        const { forSpec, idx, key, spec, args } = props
        const isNested = typeof key === "string"
        const [getIsValid, msg] = isNested ? spec[idx][key] : spec[idx]
        const extra = isNested ? `[${key}]` : ""

        if (forSpec) {
            if (typeof getIsValid !== "function") {
                throw TypeError(
                    `createValidator -> arguments[0][${idx}]${extra}[0] must be function`
                )
            }
            if (typeof msg !== "string") {
                throw TypeError(
                    `createValidator -> arguments[0][${idx}]${extra}[1] must be string`
                )
            }
        } else {
            const isValid = getIsValid(isNested ? args[idx][key] : args[idx])

            if (typeof isValid !== "boolean") {
                throw TypeError(
                    `createValidator -> arguments[0][${idx}]${extra}[0] must return boolean`
                )
            }

            const wholeMsg = `arguments[${idx}]${extra} - ${msg}`

            if (!isValid) {
                throw createError(wholeMsg, ...restArgs)
            }
        }
    }

    return spec => {
        if (!Array.isArray(spec)) {
            throw TypeError("createValidator -> arguments[0] must be array")
        }

        for (let idx = 0; idx < spec.length; idx++) {
            const item = spec[idx]
            const forSpec = true

            if (!(Array.isArray(item) && item.length === 2) && !checkObj(item)) {
                throw TypeError(
                    `createValidator -> arguments[0][${idx}] must be (array with length 2) or object`
                )
            }

            if (Array.isArray(item)) {
                validateItem({ forSpec, idx, spec })
            } else {
                const keys = Object.keys(item)

                for (let m = 0; m < keys.length; m++) {
                    validateItem({ forSpec, idx, spec, key: keys[m] })
                }
            }
        }

        return (...args) => {
            for (let idx = 0; idx < spec.length; idx++) {
                const item = spec[idx]
                const forSpec = false

                if (Array.isArray(item)) {
                    validateItem({ forSpec, idx, spec, args })
                } else {
                    if (typeof args[idx] !== "object" || args[idx] === null) {
                        throw TypeError(`arguments[${idx}] - must be of object type`)
                    }

                    const keys = Object.keys(item)

                    for (let m = 0; m < keys.length; m++) {
                        validateItem({ forSpec, idx, spec, args, key: keys[m] })
                    }
                }
            }
        }
    }
}

export const createValidator = createValidatorCustom(TypeError)
