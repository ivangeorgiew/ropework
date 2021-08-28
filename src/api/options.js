import { createFunc } from '../utils/createFunc'
import { changeErrorLogger, changeNotify } from '../utils/helpers'
import { isFunc, isNil, isObj, or } from './validating'

export const changeOptions = createFunc(
    'changing global options',
    () => {},
    props => {
        or(isObj(props), TypeError('You must pass an object'))

        const { errorLogger, notify } = props

        or(
            isFunc(errorLogger) || isFunc(notify),
            TypeError('Wrong key names or wrong values')
        )
        or(
            isNil(errorLogger) || isFunc(errorLogger),
            TypeError('`errorLogger` must be function if given')
        )
        or(
            isNil(notify) || isFunc(notify),
            TypeError('`notify` must be function if given')
        )

        if (isFunc(errorLogger)) {
            changeErrorLogger(errorLogger)
        }

        if (isFunc(notify)) {
            changeNotify(notify)
        }
    }
)
