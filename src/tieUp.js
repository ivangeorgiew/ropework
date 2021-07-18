import { cloneData } from './utils/cloning'
import { createFunc } from './utils/createFunc'

export const tieUp = createFunc({
    descr: 'tying up data',
    argTypes: `{
        :descr: str,
        :argTypes: str | undef,
        :onError: () | undef,
        :useCache: () | undef,
        :data: any
    }`,
    onError: ({ args: [props] }) => props?.data,
    data: function (props) {
        const { descr, data } = props

        if (data === null || !['object', 'function'].includes(typeof data)) {
            return data
        }

        const handledData = cloneData({ options: props, refs: new WeakMap() })

        if (typeof handledData === 'function') {
            Object.defineProperty(handledData, 'name', {
                value: descr,
                configurable: true
            })
        }

        return handledData
    }
})

export const tieUpPartial = tieUp({
    descr: 'tying up a partial function',
    argTypes: `{
        :descr: str,
        :argTypes: str | undef,
        :onError: () | undef,
        :useCache: () | undef,
        :argTypesOuter: str | undef,
        :onErrorOuter: () | undef,
        :useCacheOuter: () | undef,
        :data: ()
    }`,
    onError: () => () => () => {},
    data: function (props) {
        const {
            descr,
            onErrorOuter = () => () => {},
            useCacheOuter,
            argTypesOuter,
            onError = () => {},
            useCache,
            argTypes,
            data
        } = props

        const handledPartialFunc = tieUp({
            descr: `partially ${descr}`,
            argTypes: argTypesOuter,
            useCache: useCacheOuter,
            onError: onErrorOuter,
            data: function (...args) {
                const appliedFunc = data.apply(this, args)

                if (typeof appliedFunc !== 'function') {
                    throw new Error(
                        'Partial function should return a function, ' +
                            'instead received ' +
                            typeof appliedFunc
                    )
                }

                return tieUp({
                    descr,
                    useCache,
                    onError,
                    argTypes,
                    data: appliedFunc
                })
            }
        })

        return handledPartialFunc
    }
})
