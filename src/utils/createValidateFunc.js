import { SpecError, isTest } from "../api/constants"
import { objTypeDef, specDef } from "../api/definitions"
import { checkObj, checkObjType, innerLogError } from "./innerConstants"

export const createValidateFunc = spec => {
    try {
        const validateItem = opts => {
            try {
                if (isTest) {
                    if (!checkObj(opts)) {
                        throw SpecError("arguments[0] - must be object")
                    }

                    if (typeof opts.key !== "string") {
                        throw SpecError("arguments[0][key] - must be string")
                    }

                    if (typeof opts.getMsg !== "function") {
                        throw SpecError("arguments[0][getMsg] - must be function")
                    }
                }

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
                        descr: "[validateItem] from the library",
                        args: [opts],
                        error,
                    })
                } catch {
                    // nothing
                }

                return ""
            }
        }

        const getArgsErrorMsg = args => {
            try {
                if (isTest) {
                    if (!Array.isArray(args)) {
                        throw SpecError("arguments[0] - must be array")
                    }
                }

                const initLen = args.length < spec.length ? args.length : spec.length
                const list = Array(initLen)
                const refs = new WeakSet()

                const addProps = opts => {
                    try {
                        if (isTest) {
                            if (!checkObj(opts)) {
                                throw SpecError("arguments[0] - must be object")
                            }

                            if (typeof opts.key !== "string") {
                                throw SpecError("arguments[0][key] - must be string")
                            }

                            if (!checkObj(opts.props)) {
                                throw SpecError(
                                    "arguments[0][props] - must be object"
                                )
                            }

                            if (typeof opts.isStrict !== "boolean") {
                                throw SpecError(
                                    "arguments[0][props] - must be boolean"
                                )
                            }
                        }

                        const { key, props, argsVal, isStrict } = opts
                        const propsKeys = Object.keys(props)

                        for (let m = 0; m < propsKeys.length; m++) {
                            const propsKey = propsKeys[m]

                            if (isStrict || propsKey in argsVal) {
                                list.push([
                                    `${key}[${propsKey}]`,
                                    props[propsKey],
                                    argsVal[propsKey],
                                ])
                            }
                        }

                        refs.add(argsVal)
                    } catch (error) {
                        try {
                            innerLogError({
                                descr: "[addProps] from the library",
                                args: [opts],
                                error,
                            })
                        } catch {
                            // nothing
                        }
                    }
                }

                for (let i = 0; i < list.length; i++) {
                    const isMain = i < initLen
                    const item = list[i]

                    const key = isMain ? `[${i}]` : item[0]
                    const specVal = isMain ? spec[i] : item[1]
                    const argsVal = isMain ? args[i] : item[2]

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

                    if ("props" in specVal && !refs.has(argsVal)) {
                        if (checkObjType(argsVal)) {
                            addProps({
                                key,
                                props: specVal.props,
                                argsVal,
                                isStrict: false,
                            })
                        }
                    }

                    if ("strictProps" in specVal && !refs.has(argsVal)) {
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
                        descr: "[getArgsErrorMsg] from the library",
                        args: [args],
                        error,
                    })
                } catch {
                    // nothing
                }

                return ""
            }
        }

        if (isTest) {
            const msg = validateItem({
                key: "[specDef]",
                argsVal: spec,
                getMsg: specDef.getMsg,
            })

            if (msg !== "") {
                throw SpecError(msg)
            }
        }

        return args => {
            if (isTest) {
                try {
                    if (!Array.isArray(args)) {
                        throw SpecError("arguments[0] - must be array")
                    }
                } catch (error) {
                    try {
                        innerLogError({
                            descr: "[validation function] from the library",
                            args: [spec],
                            error,
                        })
                    } catch {
                        // nothing
                    }
                }
            }

            const msg = getArgsErrorMsg(args)

            if (msg !== "") {
                throw SpecError(msg)
            }
        }
    } catch (error) {
        try {
            innerLogError({
                descr: "[createValidateFunc] from the library",
                args: [spec],
                error,
            })
        } catch {
            // nothing
        }

        return () => () => {}
    }
}
