import { createFunc } from '../utils/createFunc'

export const isStr = val => typeof val === 'string'
export const isNum = val => typeof val === 'number'
export const isBigInt = val => typeof val === 'bigint'
export const isBool = val => typeof val === 'boolean'
export const isSym = val => typeof val === 'symbol'
export const isNil = val => val === undefined || val === null
export const isFunc = val => typeof val === 'function'
export const isArr = val => Array.isArray(val)
export const isObj = val => !isNil(val) && typeof val === 'object' && !isArr(val)

const validateOr = createFunc(
    'validating statements',
    () => false,
    (isValid, error) => {
        if (typeof isValid !== 'boolean') {
            throw TypeError('First argument must be boolean')
        }

        if (!(error instanceof Error)) {
            throw TypeError('Second argument must be instanceof Error')
        }

        return true
    }
)

export const or = (isValid, error) => {
    if (validateOr(isValid, error) && !isValid) {
        throw error
    }
}
