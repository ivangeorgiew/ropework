import { createFunc } from '../utils/createFunc'
import { changeErrorLogger, changeNotify } from '../utils/helpers'
import { isObj, or } from './validating'

export const changeOptions = createFunc(
    'changing global options',
    () => {},
    props => {
        or(isObj(props), TypeError('First argument must be an object'))

        let hasMadeChanges = false

        if (typeof props.errorLogger === 'function') {
            changeErrorLogger(props.errorLogger)
            hasMadeChanges = true
        }

        if (typeof props.notify === 'function') {
            changeNotify(props.notify)
            hasMadeChanges = true
        }

        or(hasMadeChanges, TypeError('Incorrect properties of the given object'))
    }
)
