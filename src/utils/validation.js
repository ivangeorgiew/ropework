import { logError } from './logging'

export const parseArgTypes = function (descr, argTypes) {
    try {
        argTypes = argTypes.replace(/\n|\t|\r/g, '')

        const keyReg = /^\s*:[^:]+:\s*/
        const simpleTypeReg = new RegExp(
            '^\\s*(:([^:]+):\\s*)?(\\{\\s*\\}|\\[\\s*\\]|\\(\\s*\\)|' +
                '@\\w+|\\w+\\s*(=\\s*\\d+|>\\s*\\d+|>=\\s*\\d+)?\\s*' +
                '(<\\s*\\d+|<=\\s*\\d+)?)\\s*'
        )
        const openSymReg = /^\s*(:([^:]+):\s*)?(\{|\[|\()\s*/
        const closeSymReg = /^\s*(\}|\]|\))\s*/
        const endReg = /^(\}|\]|\)|\||,|$)/
        const reg1 = /^(null|undef|bool|any)\w*$/
        const reg2 = /^@(\w+)$/
        const reg3 = /^(str|num|int)\w*(=\d+|>\d+|>=\d+)?(<\d+|<=\d+)?$/
        const reg4 = /^(\{\}|\[\]|\(\))$/
        const closeSymDict = { '{': '}', '[': ']', '(': ')' }
        const parsedTypes = [[]]
        const pathToStore = [0]
        const openSymHistory = []

        while (argTypes.length) {
            const currStore = pathToStore.reduce((acc, key) => acc[key], parsedTypes)

            if (simpleTypeReg.test(argTypes)) {
                const workingPart = simpleTypeReg.exec(argTypes)[0]
                const objKey = keyReg.test(workingPart)
                    ? workingPart.replace(simpleTypeReg, '$2')
                    : ''
                const typeDescr = workingPart
                    .replace(simpleTypeReg, '$3')
                    .replace(/\s+/g, '')

                let parsedType

                // parse typeDescr to type object
                if (reg1.test(typeDescr)) {
                    parsedType = { type: typeDescr.replace(reg1, '$1') }
                } else if (reg2.test(typeDescr)) {
                    parsedType = { inst: typeDescr.replace(reg2, '$1') }
                } else if (reg3.test(typeDescr)) {
                    parsedType = JSON.parse(
                        typeDescr.replace(
                            reg3,
                            '{ "type": "$1", "eqs": ["$2", "$3"] }'
                        )
                    )
                    parsedType.eqs = parsedType.eqs.filter(eq => eq.length > 0)
                } else if (reg4.test(typeDescr)) {
                    parsedType = { type: typeDescr[0] }
                } else {
                    throw new Error(`${typeDescr} is invalid simple type`)
                }

                // remove the already parsed part
                argTypes = argTypes.replace(simpleTypeReg, '')

                // must have an ending symbol
                if (!endReg.test(argTypes)) {
                    throw new Error('Missing ending symbol in argTypes')
                }

                const endSym = argTypes[0]

                // save parsedType and modify parsedTypes, pathToStore
                if (objKey === '') {
                    currStore.push(parsedType)

                    if (endSym === ',') {
                        if (pathToStore.length === 1) {
                            parsedTypes.push([])
                            pathToStore[0]++
                        } else {
                            pathToStore.pop()
                        }
                    }
                } else {
                    currStore[objKey] = [parsedType]

                    if (endSym === '|') {
                        pathToStore.push(objKey)
                    }
                }

                // remove seperating symbol
                if (/\||,/.test(endSym)) {
                    argTypes = argTypes.slice(1)
                }
            } else if (openSymReg.test(argTypes)) {
                const workingPart = openSymReg.exec(argTypes)[0]
                const objKey = keyReg.test(workingPart)
                    ? workingPart.replace(openSymReg, '$2')
                    : ''
                const openSym = workingPart.replace(openSymReg, '$3')
                const parsedType = { type: openSym, props: {} }

                // remove the already parsed part
                argTypes = argTypes.replace(openSymReg, '')

                // save parsedType and modify parsedTypes, pathToStore
                if (objKey === '') {
                    currStore.push(parsedType)
                    pathToStore.push(currStore.length - 1, 'props')
                } else {
                    currStore[objKey] = [parsedType]
                    pathToStore.push(objKey, 0, 'props')
                }

                // add an opening symbol to history
                openSymHistory.push(openSym)
            } else if (closeSymReg.test(argTypes)) {
                const workingPart = closeSymReg.exec(argTypes)[0]
                const closeSym = workingPart.replace(closeSymReg, '$1')
                const lastOpenSym = openSymHistory[openSymHistory.length - 1]

                // last open symbol has to match current close symbol
                if (closeSymDict[lastOpenSym] !== closeSym) {
                    throw new Error(
                        'There is a mismatch between opening and closing symbols'
                    )
                }

                // remove the already parsed part
                argTypes = argTypes.replace(closeSymReg, '')

                // must have an ending symbol
                if (!endReg.test(argTypes)) {
                    throw new Error('Missing ending symbol in argTypes')
                }

                const endSym = argTypes[0]

                // modify parsedTypes, pathToStore
                pathToStore.pop()
                pathToStore.pop()

                if (endSym !== '|') {
                    if (pathToStore.length === 1) {
                        parsedTypes.push([])
                        pathToStore[0]++
                    } else {
                        pathToStore.pop()
                    }
                }

                // remove seperating symbol
                if (/\||,/.test(endSym)) {
                    argTypes = argTypes.slice(1)
                }

                // open symbols history must not be empty
                if (openSymHistory.length < 1) {
                    throw new Error('There are more closing symbols than opening')
                }

                // remove last opened sym, already handled
                openSymHistory.pop()
            } else {
                throw new Error('Argument argTypes has incorrect format')
            }
        }

        // every opening {|[|( must be closed
        if (openSymHistory.length > 0) {
            throw new Error('There are more opening symbols than closing')
        }

        // handle dangling comma
        if (parsedTypes[parsedTypes.length - 1].length === 0) {
            parsedTypes.pop()
        }

        return parsedTypes
    } catch (error) {
        logError({
            descr: `parsing argTypes for ${descr}`,
            args: [argTypes],
            error
        })

        return []
    }
}

// TODO: implement
export const validateArgs = function (types, args) {
    try {
        return types.length !== -1
    } catch (error) {
        logError({
            descr: 'validating args types',
            args: [types, args],
            error
        })

        return false
    }
}

// const testArgTypes = `
//     str >= 10 <= 20 | [],
//     {
//         :my Arr: [ :0: str, :length: int < 3 ] | null,
//         :inner: { :abc: str >= 5 | any, :ii: undef },
//         :map: ( :su: bool ) | [ :2: int ] | undef,
//         :obj: { :b: undef, :c: ( :d: { :abc: int } ) }
//     } | { :my: any },
//     @URIError,
//     { :date: @Date },
//     any,
// `
// const testArgTypes = `
//     str >= 10 <= 20 | [ :0: int ] | null,
//     { :a b: () | undef, :c: int },
//     boolean   ,
//     undef,
//     @URIError | @Error | null,
//     int > 5 <= 10
// `

// console.dir(parseArgTypes('test', testArgTypes), { depth: null })

/* bool
 * null
 * undef
 * any
 * @URIError (for check use window['URIError'])
 * str, str <= 10, str >= 0, str >= 0 <= 10, str = 5
 * num, num <= 10, num >= 0, num >= 0 <= 10, num = 5
 * int, int <= 10, int >= 0, int >= 0 <= 10, int = 5
 * [], [ length: int > 2, someProp: bool ]
 * {}, { a: num >= 5, b: bool }
 * (), ( a: ( b: [] ) )
 * combination of with |
 */
