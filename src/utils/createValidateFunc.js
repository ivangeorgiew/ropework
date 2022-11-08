import { SpecError, isTest } from "../api/constants"
import { objTypeDef, specDef } from "../api/definitions"
import { checkObj, checkObjType, innerLogError } from "./innerConstants"

const validateItem = opts => {
    if (isTest) {
        if (!checkObj(opts)) {
            throw new SpecError(
                "calling [validateItem], arguments[0] - must be object"
            )
        }

        if (typeof opts.key !== "string") {
            throw new SpecError(
                "calling [validateItem], arguments[0][key] - must be string"
            )
        }

        if (typeof opts.getMsg !== "function") {
            throw new SpecError(
                "calling [validateItem], arguments[0][getMsg] - must be function"
            )
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

                return ""
            }
        })()

        if (typeof msg !== "string") {
            return `spec${key}[getMsg] must return a string when called`
        }

        if (msg !== "") {
            return `arguments${key} - ${msg}`
        }

        return ""
    } catch (error) {
        try {
            innerLogError({
                descr: "[validateItem] from library tied-up",
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
            throw new SpecError(
                "calling [getArgsErrorMsg], arguments[0] - must be array"
            )
        }

        if (!Array.isArray(args)) {
            throw new SpecError(
                "calling [getArgsErrorMsg], arguments[1] - must be array"
            )
        }
    }

    try {
        const initLen =
            spec.length > 1 && args.length < spec.length ? args.length : spec.length

        const list = Array(initLen)
        const refs = new WeakSet()

        const addProps = opts => {
            if (isTest) {
                if (!checkObj(opts)) {
                    throw new SpecError(
                        "calling [addProps], arguments[0] - must be object"
                    )
                }

                if (typeof opts.key !== "string") {
                    throw new SpecError(
                        "calling [addProps], arguments[0][key] - must be string"
                    )
                }

                if (!checkObj(opts.props)) {
                    throw new SpecError(
                        "calling [addProps], arguments[0][props] - must be object"
                    )
                }

                if (typeof opts.isStrict !== "boolean") {
                    throw new SpecError(
                        "calling [addProps], arguments[0][props] - must be boolean"
                    )
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
                        descr: "[addProps] from library tied-up",
                        args: [opts],
                        error,
                    })
                } catch {
                    // nothing
                }
            }
        }

        for (let i = 0; i < list.length; i++) {
            const key = i < initLen ? `[${i}]` : list[i].key
            const specVal = i < initLen ? spec[i] : list[i].specVal
            const argsVal = i < initLen ? args[i] : list[i].argsVal

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

            if (refs.has(argsVal)) continue

            if ("props" in specVal) {
                if (checkObjType(argsVal)) {
                    addProps({
                        key,
                        props: specVal.props,
                        argsVal,
                        isStrict: false,
                    })
                }
            }

            if ("strictProps" in specVal) {
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
                    props: specVal.strictProps,
                    argsVal,
                    isStrict: true,
                })
            }
        }

        return ""
    } catch (error) {
        try {
            innerLogError({
                descr: "[getArgsErrorMsg] from library tied-up",
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
                throw new SpecError(
                    `calling [createValidateFunc], arguments[0] - ${msg}`
                )
            }
        }

        return args => {
            if (isTest) {
                if (!Array.isArray(args)) {
                    throw new SpecError(
                        "calling [validation function], arguments[0] - must be array"
                    )
                }
            }

            return getArgsErrorMsg(spec, args)
        }
    } catch (error) {
        try {
            innerLogError({
                descr: "[createValidateFunc] from library tied-up",
                args: [spec],
                error,
            })
        } catch {
            // nothing
        }

        return () => () => {}
    }
}
