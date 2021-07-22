import { tieUp } from './tieUp'

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
