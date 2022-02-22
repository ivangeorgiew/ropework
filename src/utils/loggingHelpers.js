import { isTest } from "../api/constants"
import { idxDef, strDef } from "../api/definitions"
import { createValidateFunc } from "./createValidateFunc"
import { innerLogError, options } from "./innerConstants"

export const notify = (...args) => {
    try {
        options.notify(...args)
    } catch (error) {
        try {
            innerLogError({ descr: "notify", args, error })
        } catch {
            // nothing
        }
    }
}

export const errorsCache = []

const getErrorsCacheIdxValidate = createValidateFunc([strDef, strDef])

export const getErrorsCacheIdx = (descr, msg) => {
    try {
        if (isTest) {
            getErrorsCacheIdxValidate([descr, msg])
        }

        const errorsCacheLen = errorsCache.length

        if (errorsCacheLen === 0) {
            return -1
        }

        for (let i = 0; i < errorsCacheLen; i++) {
            const item = errorsCache[i]

            if (descr === item.descr && msg === item.msg) {
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
                innerLogError({
                    descr: "getErrorsCacheIdx",
                    args: [descr, msg],
                    error,
                })
            } catch {
                // nothing
            }
        }

        return -1
    }
}

const manageErrorsCacheValidate = createValidateFunc([idxDef, strDef, strDef])

export const manageErrorsCache = (_idx, descr, msg) => {
    try {
        if (isTest) {
            manageErrorsCacheValidate([_idx, descr, msg])
        }

        let idx = _idx > 5 ? 5 : _idx

        while (idx--) {
            errorsCache[idx + 1] = errorsCache[idx]
        }

        errorsCache[0] = { descr, msg, time: Date.now() }
    } catch (error) {
        if (isTest) {
            try {
                innerLogError({
                    descr: "manageErrorsCache",
                    args: [_idx, descr, msg],
                    error,
                })
            } catch {
                // nothing
            }
        }
    }
}
