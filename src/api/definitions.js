import {
    checkObj,
    checkObjType,
    innerLogError,
    optsKeysGetMsg,
} from "../utils/innerConstants"
import { isDev, isTest } from "./constants"

const defKeys = ["getMsg", "props", "strictProps"]

export const createDef = opts => {
    try {
        if (isDev) {
            const msg = optsKeysGetMsg(opts, defKeys)

            if (msg !== "") {
                throw TypeError(`arguments[0] - ${msg}`)
            }
        }

        const def = defKeys.reduce((acc, key) => {
            if (key in opts) {
                acc[key] = opts[key]
            }

            return acc
        }, {})

        def.constructor = createDef

        return Object.freeze(def)
    } catch (error) {
        try {
            innerLogError({
                descr: "createDef",
                args: [opts],
                error,
            })
        } catch {
            // nothing
        }

        const def = {}

        def.constructor = createDef

        return def
    }
}

export const specDef = createDef({
    getMsg: spec => {
        if (!Array.isArray(spec)) {
            return "must be spec array"
        }

        const list = Array(spec.length)
        const refs = new WeakSet()

        const addProps = (key, props) => {
            try {
                if (isTest) {
                    if (typeof key !== "string") {
                        throw TypeError("arguments[0] - must be string")
                    }

                    if (!checkObjType(props)) {
                        throw TypeError("arguments[1] - must be of object type")
                    }
                }

                const propKeys = Object.keys(props)

                for (let m = 0; m < propKeys.length; m++) {
                    const propKey = propKeys[m]

                    list.push([`${key}[${propKey}]`, props[propKey]])
                }

                refs.add(props)
            } catch (error) {
                if (isTest) {
                    try {
                        innerLogError({
                            descr: "addProps",
                            args: [key, props],
                            error,
                        })
                    } catch {
                        // nothing
                    }
                }
            }
        }

        for (let i = 0; i < list.length; i++) {
            const isMain = i < spec.length
            const item = list[i]

            const key = isMain ? `[${i}]` : item[0]
            const specVal = isMain ? spec[i] : item[1]

            if (!checkObjType(specVal) || specVal.constructor !== createDef) {
                return `spec${key} must be made with createDef function`
            }

            if ("getMsg" in specVal) {
                if (typeof specVal.getMsg !== "function") {
                    return `spec${key}[getMsg] must be function`
                }
            }

            if ("props" in specVal && !refs.has(specVal.props)) {
                if (!checkObj(specVal.props)) {
                    return `spec${key}[props] must be object when provided`
                }

                addProps(key, specVal.props)
            }

            if ("strictProps" in specVal && !refs.has(specVal.strictProps)) {
                if (!checkObj(specVal.strictProps)) {
                    return `spec${key}[strictProps] must be object when provided`
                }

                addProps(key, specVal.strictProps)
            }
        }

        return ""
    },
})

export const strDef = createDef({
    getMsg: a => (typeof a !== "string" ? "must be string" : ""),
})

export const numDef = createDef({
    getMsg: a => (typeof a !== "number" ? "must be number" : ""),
})

export const bigIntDef = createDef({
    getMsg: a => (typeof a !== "bigint" ? "must be BigInt" : ""),
})

export const boolDef = createDef({
    getMsg: a => (typeof a !== "boolean" ? "must be boolean" : ""),
})

export const symDef = createDef({
    getMsg: a => (typeof a !== "symbol" ? "must be Symbol" : ""),
})

export const funcDef = createDef({
    getMsg: a => (typeof a !== "function" ? "must be function" : ""),
})

export const arrDef = createDef({
    getMsg: a => (!Array.isArray(a) ? "must be array" : ""),
})

export const definedDef = createDef({
    getMsg: a => (a === undefined ? "must be defined" : ""),
})

export const anyDef = createDef({
    getMsg: () => "",
})

export const objTypeDef = createDef({
    getMsg: a => (!checkObjType(a) ? "must be of object type" : ""),
})

export const objDef = createDef({
    getMsg: a => (!checkObj(a) ? "must be object" : ""),
})

export const intDef = createDef({
    getMsg: a =>
        !Number.isInteger(a) || !Number.isFinite(a) ? "must be integer" : "",
})

export const idxDef = createDef({
    getMsg: a =>
        !Number.isInteger(a) || !Number.isFinite(a) || a < 0
            ? "must be positive integer or 0"
            : "",
})

export const constrDef = createDef({
    getMsg: a => {
        try {
            Reflect.construct(String, [], a)

            return ""
        } catch {
            return "must be constructor"
        }
    },
})

export const errorDef = createDef({
    getMsg: arg => (!(arg instanceof Error) ? "must be instance of Error" : ""),
})

export const setDef = createDef({
    getMsg: arg => (!(arg instanceof Set) ? "must be instance of Set" : ""),
})

export const mapDef = createDef({
    getMsg: arg => (!(arg instanceof Map) ? "must be instance of Map" : ""),
})