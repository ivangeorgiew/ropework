import { cloneData } from './cloning'
import { createFunc } from './createFunc'
import { parseArgTypes } from './validation'

export const tieUp = createFunc(
    'tying up data',
    function (descr, data, options) {
        if (data === null || !['object', 'function'].includes(typeof data)) {
            return data
        }

        options = Object.assign({}, options)
        options.types = parseArgTypes({
            descr,
            argTypes: options.argTypes
        })

        const handledData = cloneData({
            descr,
            data,
            options,
            refs: new WeakMap()
        })

        if (typeof handledData === 'function') {
            Object.defineProperty(handledData, 'name', {
                value: descr,
                configurable: true
            })
        }

        return handledData
    },
    { onError: ({ args }) => args[1] }
)

export const tieUpPartial = tieUp(
    'tying up a partial function',
    function (descr, func, options) {
        options = Object.assign({}, options)

        const {
            onErrorOuter = () => () => {},
            useCacheOuter,
            argTypesOuter,
            onError = () => {},
            useCache,
            argTypes
        } = Object.assign({}, options)

        const handledPartialFunc = tieUp(
            `partially ${descr}`,
            function (...args) {
                const appliedFunc = func.apply(this, args)

                if (typeof appliedFunc !== 'function') {
                    throw new Error(
                        'Partial function should return a function, ' +
                            'instead received ' +
                            typeof appliedFunc
                    )
                }

                return tieUp(descr, appliedFunc, {
                    useCache,
                    onError,
                    argTypes
                })
            },
            {
                argTypes: argTypesOuter,
                useCache: useCacheOuter,
                onError: onErrorOuter
            }
        )

        return handledPartialFunc
    },
    { onError: () => () => () => {} }
)
