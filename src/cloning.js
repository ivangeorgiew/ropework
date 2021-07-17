import { createFunc } from './createFunc'
import { logError } from './logging'
import { parseArgTypes } from './validation'

export const cloneData = createFunc(
    'cloning data error-handled',
    function (props) {
        props = Object.assign({}, props)

        if (
            props.data === null ||
            !['object', 'function'].includes(typeof props.data)
        ) {
            return props.data
        }

        const stack = [props]
        let [result, isFirstCall] = [undefined, true]

        while (stack.length) {
            const curr = stack.pop()
            const { descr, data, refs, options } = curr
            const { target, targetKey, targetDescriptor } = curr

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
                handledData = createFunc(descr, data, options)
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
                        !String(key).match(/.+(OnError|UseCache)$/)
                    ) {
                        const keyDescr = `${descr}["${key}"]`
                        const argTypes = data[`${key}ArgTypes`]
                        const types = parseArgTypes({
                            descr: keyDescr,
                            argTypes
                        })

                        stack.push({
                            target: handledData,
                            targetKey: key,
                            targetDescriptor: descriptors[key],
                            descr: keyDescr,
                            data: value,
                            refs,
                            options: {
                                onError: data[`${key}OnError`],
                                useCache: data[`${key}UseCache`],
                                types
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
    },
    { onError: ({ args: [props] }) => Object.assign({}, props).data }
)
