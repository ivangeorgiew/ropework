import { SpecError, isTest } from "../api/constants"
import { objTypeDef, specDef } from "../api/definitions"
import { LIB_ERROR_TEXT, checkObj, checkObjType, innerLogError } from "./innerConstants"

const validateItem = opts => {
    if (isTest) {
        if (!checkObj(opts)) {
            throw new SpecError("While calling [validateItem]:\n  args[0] - must be object")
        }

        if (typeof opts.key !== "string") {
            throw new SpecError("While calling [validateItem]:\n  args[0][key] - must be string")
        }

        if (typeof opts.getMsg !== "function") {
            throw new SpecError("While calling [validateItem]:\n  args[0][getMsg] - must be function")
        }
    }

    try {
        const { key, argsVal, getMsg } = opts

        const msg = (function () {
            try {
                return getMsg(argsVal)
            } catch (error) {
                try {
                    innerLogError({
                        descr: `spec${key}[getMsg]`,
                        args: [argsVal],
                        error,
                    })
                } catch {
                    // nothing
                }

                return `spec${key}[getMsg] threw an error`
            }
        })()

        if (typeof msg !== "string") {
            return `spec${key}[getMsg] must return a string when called`
        }

        if (msg !== "") {
            return `args${key} - ${msg}`
        }

        return ""
    } catch (error) {
        try {
            innerLogError({
                descr: `[validateItem] ${LIB_ERROR_TEXT}`,
                args: [opts],
                error,
            })
        } catch {
            // nothing
        }

        return ""
    }
}

const getArgsErrorMsg = (spec, args) => {
    if (isTest) {
        // spec is already checked to be valid in createValidateFunc
        if (!Array.isArray(spec)) {
            throw new SpecError("While calling [getArgsErrorMsg]:\n  args[0] - must be array")
        }

        if (!Array.isArray(args)) {
            throw new SpecError("While calling [getArgsErrorMsg]:\n  args[1] - must be array")
        }
    }

    try {
        const initLen = args.length < spec.length ? args.length : spec.length
        const list = Array(initLen)
        const refs = new WeakSet()

        const addProps = opts => {
            if (isTest) {
                if (!checkObj(opts)) {
                    throw new SpecError("While calling [addProps]:\n  args[0] - must be object")
                }

                if (typeof opts.key !== "string") {
                    throw new SpecError("While calling [addProps]:\n  args[0][key] - must be string")
                }

                if (!checkObj(opts.props)) {
                    throw new SpecError("While calling [addProps]:\n  args[0][props] - must be object")
                }

                if (typeof opts.isStrict !== "boolean") {
                    throw new SpecError("While calling [addProps]:\n  args[0][isStrict] - must be boolean")
                }
            }

            try {
                const { key, props, argsVal, isStrict } = opts
                const propsKeys = Object.keys(props)

                for (let m = 0; m < propsKeys.length; m++) {
                    const propsKey = propsKeys[m]

                    if (isStrict || propsKey in argsVal) {
                        list.push({
                            key: `${key}[${propsKey}]`,
                            specVal: props[propsKey],
                            argsVal: argsVal[propsKey],
                        })
                    }
                }

                refs.add(argsVal)
            } catch (error) {
                try {
                    innerLogError({
                        descr: `[addProps] ${LIB_ERROR_TEXT}`,
                        args: [opts],
                        error,
                    })
                } catch {
                    // nothing
                }
            }
        }

        // list's length gets increased if optProps or reqProps is used
        for (let i = 0; i < list.length; i++) {
            const key = i < initLen ? `[${i}]` : list[i].key
            const specVal = i < initLen ? spec[i] : list[i].specVal
            const argsVal = i < initLen ? args[i] : list[i].argsVal

            if (refs.has(argsVal)) continue

            if ("getMsg" in specVal) {
                const msg = validateItem({
                    key,
                    argsVal,
                    getMsg: specVal.getMsg,
                })

                if (msg !== "") {
                    return msg
                }
            }

            if ("optProps" in specVal) {
                if (checkObjType(argsVal)) {
                    addProps({
                        key,
                        props: specVal.optProps,
                        argsVal,
                        isStrict: false,
                    })
                }
            }

            if ("reqProps" in specVal) {
                const msg = validateItem({
                    key,
                    argsVal,
                    getMsg: objTypeDef.getMsg,
                })

                if (msg !== "") {
                    return msg
                }

                addProps({
                    key,
                    props: specVal.reqProps,
                    argsVal,
                    isStrict: true,
                })
            }
        }

        return ""
    } catch (error) {
        try {
            innerLogError({
                descr: `[getArgsErrorMsg] ${LIB_ERROR_TEXT}`,
                args: [args],
                error,
            })
        } catch {
            // nothing
        }

        return ""
    }
}

export const createValidateFunc = spec => {
    try {
        if (isTest) {
            const msg = specDef.getMsg(spec)

            if (msg !== "") {
                throw new SpecError(`While calling [createValidateFunc]:\n  args[0] - ${msg}`)
            }
        }

        return args => {
            if (isTest) {
                if (!Array.isArray(args)) {
                    throw new SpecError("While calling [validation function]:\n  args[0] - must be array")
                }
            }

            return getArgsErrorMsg(spec, args)
        }
    } catch (error) {
        try {
            innerLogError({
                descr: `[createValidateFunc] ${LIB_ERROR_TEXT}`,
                args: [spec],
                error,
            })
        } catch {
            // nothing
        }

        return () => ""
    }
}
