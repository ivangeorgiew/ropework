import { innerLogError, isTest } from "../utils/generics"

const createChecker = (descr, func) => {
    try {
        if (isTest) {
            if (typeof descr !== "string") {
                throw TypeError("arguments[0] - must be string")
            }

            if (typeof func !== "function") {
                throw TypeError("arguments[1] - must be function")
            }
        }

        return a => {
            try {
                return func(a)
            } catch (error) {
                if (isTest) {
                    try {
                        innerLogError({ descr, args: [a], error })
                    } catch {
                        // nothing
                    }
                }

                return true
            }
        }
    } catch (error) {
        if (isTest) {
            try {
                innerLogError({
                    descr: "createChecker",
                    args: [descr, func],
                    error,
                })
            } catch {
                // nothing
            }
        }

        return () => true
    }
}

export const checkInt = createChecker(
    "checkInt",
    a => Number.isInteger(a) && Number.isFinite(a)
)

export const checkIdx = createChecker("checkIdx", a => checkInt(a) && a >= 0)

export const checkObjType = createChecker("checkObjType", a => {
    const t = typeof a

    return a !== null && (t === "object" || t === "function")
})

export const checkObj = createChecker("checkObj", a => {
    const c = a.constructor

    return checkObjType(a) && (c === Object || c === undefined)
})

export const checkConstr = createChecker("checkConstr", a =>
    Reflect.construct(String, [], a)
)
