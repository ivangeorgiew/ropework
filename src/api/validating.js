import { createFunc } from '../utils/createFunc'

const wrap = createFunc(
    'creating simple validation function',
    () => () => false,
    (what, func) => createFunc(`checking if ${what}`, () => false, func, true)
)

export const isStr = wrap('string', val => typeof val === 'string')
export const isNum = wrap('number', val => typeof val === 'number')
export const isInt = wrap(
    'integer',
    val => Number.isInteger(val) && Number.isFinite(val)
)
export const isBigInt = wrap('BigInt', val => typeof val === 'bigint')
export const isBool = wrap('boolean', val => typeof val === 'boolean')
export const isSym = wrap('Symbol', val => typeof val === 'symbol')
export const isNil = wrap(
    'undefined or null',
    val => val === undefined || val === null
)
export const isFunc = wrap('function', val => typeof val === 'function')
export const isArr = wrap('array', val => Array.isArray(val))
export const isObj = wrap(
    'object',
    val => !isNil(val) && typeof val === 'object' && !isArr(val)
)

const checkIfArgsValid = createFunc(
    'validating `or` arguments',
    () => false,
    (isValid, error) => {
        if (!isBool(isValid)) {
            throw TypeError('First argument must be boolean')
        }

        if (!(error instanceof Error)) {
            throw TypeError('Second argument must be instanceof Error')
        }

        return true
    }
)

export const or = (isValid, error) => {
    if (checkIfArgsValid(isValid, error) && !isValid) {
        throw error
    }
}
