import { createFunc } from './createFunc'
import { logError } from './logging'

export const cloneData = createFunc({
    descr: 'cloning data error-handled',
    argTypes: `{
        :options: {
            :desrc: string,
            :onError: () | undef,
            :useCache: () | undef,
            :argTypes: str | undef,
            :data: {} | ()
        },
        :refs: @WeakMap
    }`,
    onError: ({ args: [props] }) => props?.options?.data,
    data: function (props) {
        const stack = [props]
        let [result, isFirstCall] = [undefined, true]

        while (stack.length) {
            const curr = stack.pop()
            const { target, targetKey, targetDescriptor } = curr
            const { options, refs } = curr
            const { descr, data } = options

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
                handledData = createFunc(options)
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
                        stack.push({
                            target: handledData,
                            targetKey: key,
                            targetDescriptor: descriptors[key],
                            refs,
                            options: {
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
