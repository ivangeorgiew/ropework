import { handledFuncs } from './constants'
import { isDevelopment } from './options'
import { createFunc } from './utils/createFunc'
import { logError } from './utils/logging'

const createHandledCopy = createFunc({
    descr: 'creating handled copy of function',
    onError: ({ args: { func } }) => func,
    func: function (props) {
        const { descr, func } = props

        if (handledFuncs.has(func)) {
            return func
        }

        const handledFunc = createFunc(props)
        const descriptors = Object.getOwnPropertyDescriptors(func)
        const descriptorKeys = [
            ...Object.getOwnPropertyNames(descriptors),
            ...Object.getOwnPropertySymbols(descriptors)
        ]

        Object.setPrototypeOf(handledFunc, Object.getPrototypeOf(func))

        for (let i = 0; i < descriptorKeys.length; i++) {
            // key can be a Symbol
            const key = String(descriptorKeys[i])

            try {
                Object.defineProperty(handledFunc, key, descriptors[key])
            } catch (error) {
                logError({
                    descr: `assigning method ${key} to ${descr}`,
                    error,
                    args: [func]
                })
            }
        }

        if (
            isDevelopment &&
            typeof handledFunc === 'function' &&
            typeof handledFunc.name === 'string'
        ) {
            Object.defineProperty(handledFunc, 'name', {
                value: `[${descr}]`,
                configurable: true
            })
        }

        handledFuncs.add(handledFunc)

        return handledFunc
    }
})

export const tieUp = createFunc({
    descr: 'tying up function',
    onError: () => () => {},
    func: function (descr, onError, func, undef) {
        if (typeof descr !== 'string') {
            throw new TypeError('First argument must be the description string')
        }

        if (typeof onError !== 'function') {
            throw new TypeError(
                'Second argument must be the function called on error'
            )
        }

        if (typeof func !== 'function') {
            throw new TypeError('Third argument must be the main function')
        }

        if (typeof undef === 'function') {
            throw new TypeError(
                'You gave 4 arguments, did you mean to call `tieUpMemo`'
            )
        }

        return createHandledCopy({ descr, func, onError })
    }
})

export const tieUpMemo = createFunc({
    descr: 'tying up memoized function',
    onError: () => () => {},
    func: function (descr, useCache, onError, func) {
        if (typeof descr !== 'string') {
            throw new TypeError('First argument must be the description string')
        }

        if (typeof useCache !== 'function') {
            throw new TypeError(
                'Second argument must be the function used for caching'
            )
        }

        if (typeof onError !== 'function') {
            throw new TypeError(
                'Third argument must be the function called on error'
            )
        }

        if (typeof func !== 'function') {
            throw new TypeError('Fourth argument must be the main function')
        }

        return createHandledCopy({ descr, useCache, func, onError })
    }
})
