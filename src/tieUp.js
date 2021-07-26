import { createFunc } from './utils/createFunc'
import { logError } from './utils/logging'

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
        if (
            props.data === null ||
            !['object', 'function'].includes(typeof props.data)
        ) {
            return props.data
        }

        const refs = new WeakMap()
        const stack = [{ props }]
        let [result, isFirstCall] = [undefined, true]

        while (stack.length) {
            const { props, target, targetKey, targetDescriptor } = stack.pop()
            const { descr, data } = props

            if (refs.has(data)) {
                Object.defineProperty(
                    target,
                    targetKey,
                    Object.assign(targetDescriptor, {
                        value: refs.get(data)
                    })
                )
                continue
            }

            let handledData

            if (typeof data === 'function') {
                handledData = createFunc(props)
            } else if (data instanceof RegExp) {
                const regExpText = String(data)
                const lastSlashIdx = regExpText.lastIndexOf('/')

                handledData = new RegExp(
                    regExpText.slice(1, lastSlashIdx),
                    regExpText.slice(lastSlashIdx + 1)
                )
            } else if (data instanceof Date) {
                handledData = new Date(data.getTime())
            } else if (Array.isArray(data)) {
                handledData = []
            } else {
                handledData = {}
            }

            refs.set(data, handledData)
            Object.setPrototypeOf(handledData, Object.getPrototypeOf(data))

            const descriptors = Object.getOwnPropertyDescriptors(data)
            const descriptorKeys = Object.getOwnPropertyNames(
                descriptors
            ).concat(Object.getOwnPropertySymbols(descriptors))

            let i = -1

            while (descriptorKeys.length - ++i) {
                // key can be a Symbol
                const key = String(descriptorKeys[i])

                try {
                    const value = descriptors[key].value

                    if (!('value' in descriptors[key])) {
                        Object.defineProperty(
                            handledData,
                            key,
                            descriptors[key]
                        )
                        continue
                    }

                    if (
                        value !== null &&
                        ['object', 'function'].includes(typeof value) &&
                        !/.+(OnError|UseCache)$/.test(key)
                    ) {
                        stack.push({
                            target: handledData,
                            targetKey: key,
                            targetDescriptor: descriptors[key],
                            props: {
                                descr: `${descr}["${key}"]`,
                                onError: data[`${key}OnError`],
                                useCache: data[`${key}UseCache`],
                                argTypes: data[`${key}ArgTypes`],
                                data: value
                            }
                        })
                        continue
                    }

                    Object.defineProperty(
                        handledData,
                        key,
                        Object.assign(descriptors[key], { value })
                    )
                } catch (error) {
                    logError({
                        descr: `assigning method ${key} to ${descr}`,
                        error,
                        args: [data, handledData]
                    })
                }
            }

            if (
                typeof handledData === 'function' &&
                typeof handledData.name === 'string'
            ) {
                Object.defineProperty(handledData, 'name', {
                    value: descr,
                    configurable: true
                })
            }

            if (isFirstCall) {
                result = handledData
                isFirstCall = false
            } else {
                Object.defineProperty(
                    target,
                    targetKey,
                    Object.assign(targetDescriptor, { value: handledData })
                )
            }
        }

        return result
    }
})
