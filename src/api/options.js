import { changeErrorLogger, changeNotify } from '../utils/helpers'
import { tieEff } from './tie'

export const changeOptions = tieEff(
    'changing global options',
    () => {},
    props => {
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
