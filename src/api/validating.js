const wrapCheck = func => a => {
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

export const createDef = opts => {
    try {
        const keys = ["getMsg", "props", "strictProps"]

        return Object.freeze(
            keys.reduce((acc, key) => {
                if (key in opts) {
                    acc[key] = opts[key]
                }

                return acc
            }, {})
        )
    } catch (_e) {
        return Object.freeze({})
    }
}

export const specDef = createDef({
    getMsg: spec => {
        if (!Array.isArray(spec)) {
            return "spec must be array"
        }

        const getSpecItemMsg = (key, specVal) => {
            if (!checkObj(specVal)) {
                return `spec${key} must be object`
            }

            if (!Object.isFrozen(specVal)) {
                return `spec${key} must be made with createDef function`
            }

            if (typeof specVal.getMsg !== "function") {
                return `spec${key}[getMsg] must be function`
            }

            return ""
        }

        const list = Array(spec.length)
        const refs = new WeakSet()

        const addProps = (key, props) => {
            const propKeys = Object.keys(props)

            for (let m = 0; m < propKeys.length; m++) {
                const propKey = propKeys[m]

                list.push([`${key}[${propKey}]`, props[propKey]])
            }

            refs.add(props)
        }

        for (let i = 0; i < list.length; i++) {
            const isMain = i < spec.length
            const item = list[i]

            const key = isMain ? `[${i}]` : item[0]
            const specVal = isMain ? spec[i] : item[1]

            if ("getMsg" in specVal) {
                const msg = getSpecItemMsg(key, specVal)

                if (msg !== "") {
                    return msg
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

export const objTypeDef = createDef({
    getMsg: a => (!checkObjType(a) ? "must be of object type" : ""),
})

export const objDef = createDef({
    getMsg: a => (!checkObj(a) ? "must be object" : ""),
})

export const intDef = createDef({
    getMsg: a => (!checkInt(a) ? "must be integer" : ""),
})

export const idxDef = createDef({
    getMsg: a => (!checkIdx(a) ? "must be positive integer or 0" : ""),
})

export const constrDef = createDef({
    getMsg: a => (!checkConstr(a) ? "must be constructor" : ""),
})
