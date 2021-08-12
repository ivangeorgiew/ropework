const stringifyAll = function (data) {
    try {
        const seen = new WeakSet()
        const parser = function (_key, val) {
            if ([Infinity, NaN, null, undefined].includes(val)) {
                return String(val)
            }

            if (typeof val === 'bigint') {
                return Number(val)
            }

            if (typeof val === 'object' || typeof val === 'function') {
                if (seen.has(val)) {
                    return '[$ref]'
                }

                seen.add(val)

                if (typeof val === 'function') {
                    return '()'
                }
            }

            return val
        }

        return JSON.stringify(data, parser, 0)
    } catch (error) {
        return JSON.stringify(`[unparsed data]`)
    }
}

export const createArgsInfo = function (args) {
    try {
        let acc = ''

        for (let i = 0; i < args.length; i++) {
            const arg = args[i]
            let parsedArg = typeof arg === 'function' ? '()' : stringifyAll(arg)

            if (parsedArg.length > 100) {
                parsedArg = Array.isArray(arg) ? '[large array]' : '[large object]'
            } else {
                parsedArg = parsedArg.replace(
                    /"(Infinity|NaN|null|undefined|\(\)|\[\$ref\])"/g,
                    '$1'
                )
            }

            acc = i === 0 ? parsedArg : `${acc} , ${parsedArg}`
        }

        return acc
    } catch (error) {
        return ''
    }
}