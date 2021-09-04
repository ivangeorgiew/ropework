import { isTest } from "../api/constants"
import { createValidator, idxDef, strDef } from "../api/validating"
import { logErrorDefault } from "./helpers"

export const errorsCache = []

const getErrorsCacheIdxSpec = [strDef, strDef]
const getErrorsCacheIdxValidate = createValidator(getErrorsCacheIdxSpec)

export const getErrorsCacheIdx = (errorDescr, msg) => {
    try {
        if (isTest) {
            getErrorsCacheIdxValidate(errorDescr, msg)
        }

        const errorsCacheLen = errorsCache.length

        if (errorsCacheLen === 0) {
            return -1
        }

        for (let i = 0; i < errorsCacheLen; i++) {
            const item = errorsCache[i]

            if (errorDescr === item.errorDescr && msg === item.msg) {
                if (Date.now() - item.time < 1000) {
                    return i
                } else {
                    errorsCache.splice(i, 1)

                    return -1
                }
            }
        }

        return -1
    } catch (error) {
        if (isTest) {
            try {
                logErrorDefault({
                    descr: "getErrorsCacheIdx",
                    args: [errorDescr, msg],
                    error,
                })
            } catch (_e) {
                // nothing
            }
        }

        return -1
    }
}

const manageErrorsCacheSpec = [idxDef, strDef, strDef]
const manageErrorsCacheValidate = createValidator(manageErrorsCacheSpec)

export const manageErrorsCache = (_idx, errorDescr, msg) => {
    try {
        if (isTest) {
            manageErrorsCacheValidate(_idx, errorDescr, msg)
        }

        let idx = _idx > 5 ? 5 : _idx

        while (idx--) {
            errorsCache[idx + 1] = errorsCache[idx]
        }

        errorsCache[0] = { errorDescr, msg, time: Date.now() }
    } catch (error) {
        if (isTest) {
            try {
                logErrorDefault({
                    descr: "manageErrorsCache",
                    args: [_idx, errorDescr, msg],
                    error,
                })
            } catch (_e) {
                // nothing
            }
        }
    }
}
