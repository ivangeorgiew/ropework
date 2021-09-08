import { isTest } from "./constants"

const wrapCheck = func => a => {
    if (isTest && typeof func !== "function") {
        throw TypeError(`wrapCheck - arguments[0] must be function`)
    }

    try {
        return func(a)
    } catch (_e) {
        return false
    }
}

export const checkInt = wrapCheck(a => Number.isInteger(a) && Number.isFinite(a))

export const checkIdx = wrapCheck(a => checkInt(a) && a >= 0)

export const checkObjType = wrapCheck(a => {
    const t = typeof a

    return a !== null && (t === "object" || t === "function")
})

export const checkObj = wrapCheck(a => {
    const c = a.constructor

    return checkObjType(a) && (c === Object || c === undefined)
})

export const checkConstr = wrapCheck(a => Reflect.construct(String, [], a))

const makeDef = func => {
    if (isTest && typeof func !== "function") {
        throw TypeError(`makeDef - arguments[0] must be function`)
    }

    return Object.freeze([func])
}

export const specDef = makeDef(spec => {
    if (!Array.isArray(spec)) {
        return "spec must be array"
    }

    const getSpecItemErrorMsg = (key, specVal) => {
        if (!Array.isArray(specVal)) {
            return `spec${key} must be array`
        }

        const specValLen = specVal.length

        if (specValLen !== 1 && specValLen !== 2) {
            return `spec${key} must have length 1 or 2`
        }

        const [getErrorMsg, props] = specVal

        if (typeof getErrorMsg !== "function") {
            return `spec${key}[0] must be function`
        }

        if (specVal.length === 2 && !checkObj(props)) {
            return `spec${key}[1] must be object, if provided`
        }

        return ""
    }

    const list = Array(spec.length)
    const refs = new WeakSet()

    for (let i = 0; i < list.length; i++) {
        const isMain = i < spec.length
        const item = list[i]

        const key = isMain ? `[${i}]` : item[0]
        const specVal = isMain ? spec[i] : item[1]

        const msg = getSpecItemErrorMsg(key, specVal)

        if (msg !== "") return msg

        if (specVal.length === 2 && !refs.has(specVal[1])) {
            const propKeys = Object.keys(specVal[1])

            for (let m = 0; m < propKeys.length; m++) {
                const propKey = propKeys[m]

                list.push([`${key}[${propKey}]`, specVal[1][propKey]])
            }

            refs.add(specVal[1])
        }
    }

    return ""
})

export const strDef = makeDef(a => (typeof a === "string" ? "" : "must be string"))

export const numDef = makeDef(a => (typeof a === "number" ? "" : "must be number"))

export const bigIntDef = makeDef(a =>
    typeof a === "bigint" ? "" : "must be BigInt"
)

export const boolDef = makeDef(a =>
    typeof a === "boolean" ? "" : "must be boolean"
)

export const symDef = makeDef(a => (typeof a === "symbol" ? "" : "must be Symbol"))

export const funcDef = makeDef(a =>
    typeof a === "function" ? "" : "must be function"
)

export const arrDef = makeDef(a => (Array.isArray(a) ? "" : "must be array"))

export const definedDef = makeDef(a =>
    a !== undefined ? "" : "must not be null or undefined"
)

export const objTypeDef = makeDef(a =>
    checkObjType(a) ? "" : "must be of object type"
)

export const objDef = makeDef(a => (checkObj(a) ? "" : "must be object"))

export const intDef = makeDef(a => (checkInt(a) ? "" : "must be integer"))

export const idxDef = makeDef(a =>
    checkIdx(a) ? "" : "must be positive integer or 0"
)

export const constrDef = makeDef(a => (checkConstr(a) ? "" : "must be constructor"))
