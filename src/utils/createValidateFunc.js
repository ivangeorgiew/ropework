import { checkObjType } from "../api/checkers"
import { isDev } from "../api/constants"
import { objTypeDef, specDef } from "../api/definitions"
import { innerLogError, isTest } from "./generics"

export const createValidateFunc = spec => {
    try {
        const validateItem = (key, argsVal, getMsg) => {
            try {
                const msg = (function () {
                    try {
                        return getMsg(argsVal)
                    } catch (error) {
                        if (isDev) {
                            try {
                                innerLogError({
                                    descr: `spec${key}[getMsg]`,
                                    args: [argsVal],
                                    error,
                                })
                            } catch {
                                // nothing
                            }
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
                if (isTest) {
                    try {
                        innerLogError({
                            descr: "validateItem",
                            args: [key, argsVal, getMsg],
                            error,
                        })
                    } catch {
                        // nothing
                    }
                }

                return ""
            }
        }

        const getArgsErrorMsg = args => {
            try {
                const list = Array(spec.length)
                const refs = new WeakSet()

                const addProps = (key, argsVal, specVal, isStrict) => {
                    try {
                        const props = isStrict ? specVal.strictProps : specVal.props
                        const propKeys = Object.keys(props)

                        for (let m = 0; m < propKeys.length; m++) {
                            const propKey = propKeys[m]

                            if (isStrict || propKey in argsVal) {
                                list.push([
                                    `${key}[${propKey}]`,
                                    props[propKey],
                                    argsVal[propKey],
                                ])
                            }
                        }

                        refs.add(argsVal)
                    } catch (error) {
                        if (isTest) {
                            try {
                                innerLogError({
                                    descr: "addProps",
                                    args: [key, argsVal, specVal, isStrict],
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
                    const argsVal = isMain ? args[i] : item[2]

                    if ("getMsg" in specVal) {
                        const msg = validateItem(key, argsVal, specVal.getMsg)

                        if (msg !== "") {
                            return msg
                        }
                    }

                    if ("props" in specVal && !refs.has(argsVal)) {
                        if (checkObjType(argsVal)) {
                            addProps(key, argsVal, specVal, false)
                        }
                    }

                    if ("strictProps" in specVal && !refs.has(argsVal)) {
                        const msg = validateItem(key, argsVal, objTypeDef.getMsg)

                        if (msg !== "") {
                            return msg
                        }

                        addProps(key, argsVal, specVal, true)
                    }
                }

                return ""
            } catch (error) {
                if (isTest) {
                    try {
                        innerLogError({
                            descr: "getArgsErrorMsg",
                            args: [args],
                            error,
                        })
                    } catch {
                        // nothing
                    }
                }

                return ""
            }
        }

        if (isTest) {
            const msg = validateItem("Def", spec, specDef.getMsg)

            if (msg !== "") {
                throw TypeError(msg)
            }
        }

        return (...args) => {
            const msg = getArgsErrorMsg(args)

            if (msg !== "") {
                throw TypeError(msg)
            }
        }
    } catch (error) {
        if (isTest) {
            try {
                innerLogError({
                    descr: "createValidateFunc",
                    args: [spec],
                    error,
                })
            } catch {
                // nothing
            }
        }

        return () => {}
    }
}
