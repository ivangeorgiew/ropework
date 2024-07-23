import { LIB_ERROR_TEXT, checkObj, checkObjType, innerLogError } from "../utils/innerConstants"
import { SpecError, isTest } from "./constants"

export const specDef = {
    getMsg: spec => {
        if (!Array.isArray(spec)) {
            return "must be array"
        }

        const list = Array(spec.length)
        const refs = new WeakSet()

        const addProps = (key, props) => {
            if (isTest) {
                if (typeof key !== "string") {
                    throw new SpecError("While calling [addProps]:\n  args[0] - must be string")
                }

                if (!checkObjType(props)) {
                    throw new SpecError("While calling [addProps]:\n  args[1] - must be of object type")
                }
            }

            try {
                const propKeys = Object.keys(props)

                for (let m = 0; m < propKeys.length; m++) {
                    const propKey = propKeys[m]

                    list.push([`${key}[${propKey}]`, props[propKey]])
                }

                refs.add(props)
            } catch (error) {
                try {
                    innerLogError({
                        descr: `[addProps] ${LIB_ERROR_TEXT}`,
                        args: [key, props],
                        error,
                    })
                } catch {
                    // nothing
                }
            }
        }

        for (let i = 0; i < list.length; i++) {
            const isMain = i < spec.length
            const item = list[i]

            const key = isMain ? `[${i}]` : item[0]
            const specVal = isMain ? spec[i] : item[1]

            if (!checkObj(specVal)) {
                return `spec${key} must be object`
            }

            const validKeys = ["getMsg", "optProps", "reqProps"]
            const invalidKeys = Object.keys(specVal).filter(key => validKeys.indexOf(key) === -1)

            if (invalidKeys.length > 0) {
                return `spec${key} has invalid keys: ${invalidKeys.join(", ")}`
            }

            if ("getMsg" in specVal) {
                if (typeof specVal.getMsg !== "function") {
                    return `spec${key}[getMsg] must be function`
                }
            }

            if ("optProps" in specVal && !refs.has(specVal.optProps)) {
                if (!checkObj(specVal.optProps)) {
                    return `spec${key}[optProps] must be object when provided`
                }

                addProps(key, specVal.optProps)
            }

            if ("reqProps" in specVal && !refs.has(specVal.reqProps)) {
                if (!checkObj(specVal.reqProps)) {
                    return `spec${key}[reqProps] must be object when provided`
                }

                addProps(key, specVal.reqProps)
            }
        }

        return ""
    },
}

export const strDef = {
    getMsg: a => (typeof a !== "string" ? "must be string" : ""),
}

export const numDef = {
    getMsg: a => (typeof a !== "number" ? "must be number" : ""),
}

export const bigIntDef = {
    getMsg: a => (typeof a !== "bigint" ? "must be BigInt" : ""),
}

export const boolDef = {
    getMsg: a => (typeof a !== "boolean" ? "must be boolean" : ""),
}

export const symDef = {
    getMsg: a => (typeof a !== "symbol" ? "must be Symbol" : ""),
}

export const funcDef = {
    getMsg: a => (typeof a !== "function" ? "must be function" : ""),
}

export const arrDef = {
    getMsg: a => (!Array.isArray(a) ? "must be array" : ""),
}

export const definedDef = {
    getMsg: a => (a === undefined ? "must be defined" : ""),
}

export const undefDef = {
    getMsg: a => (a !== undefined ? "must be undefined" : ""),
}

export const anyDef = {
    getMsg: () => "",
}

export const objTypeDef = {
    getMsg: a => (!checkObjType(a) ? "must be of object type" : ""),
}

export const objDef = {
    getMsg: a => (!checkObj(a) ? "must be regular object" : ""),
}

export const intDef = {
    getMsg: a => (!Number.isInteger(a) || !Number.isFinite(a) ? "must be integer" : ""),
}

export const idxDef = {
    getMsg: a => (!Number.isInteger(a) || !Number.isFinite(a) || a < 0 ? "must be positive integer or 0" : ""),
}

export const constrDef = {
    getMsg: a => {
        try {
            Reflect.construct(String, [], a)

            return ""
        } catch {
            return "must be constructor"
        }
    },
}

export const errorDef = {
    getMsg: arg => (!(arg instanceof Error) ? "must be instance of Error" : ""),
}

export const setDef = {
    getMsg: arg => (!(arg instanceof Set) ? "must be instance of Set" : ""),
}

export const mapDef = {
    getMsg: arg => (!(arg instanceof Map) ? "must be instance of Map" : ""),
}

export const weakSetDef = {
    getMsg: arg => (!(arg instanceof WeakSet) ? "must be instance of WeakSet" : ""),
}

export const weakMapDef = {
    getMsg: arg => (!(arg instanceof WeakMap) ? "must be instance of WeakMap" : ""),
}
