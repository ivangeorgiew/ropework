import { createFunc } from '../utils/createFunc'
import { changeErrorLogger, changeNotify } from '../utils/helpers'

export const changeOptions = createFunc(
    'changing global options',
    () => {},
    function (props) {
        props = Object.assign({}, props)

        let hasMadeChanges = false

        if (typeof props.errorLogger === 'function') {
            changeErrorLogger(props.errorLogger)
            hasMadeChanges = true
        }

        if (typeof props.notify === 'function') {
            changeNotify(props.notify)
            hasMadeChanges = true
        }

        if (!hasMadeChanges) {
            throw new TypeError('Pass correct options object, please.')
        }
    }
)
