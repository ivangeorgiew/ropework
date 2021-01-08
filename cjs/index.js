'use strict'

const checkIfObject =
    val => typeof val === 'object' && !Array.isArray(val) && val !== null
const isDevelopment = checkIfObject(process) && checkIfObject(process.env)
    ? process.env.NODE_ENV !== 'production'
    : false

if (isDevelopment) {
    module.exports = require('./tied-pants.dev.js')
} else {
    module.exports = require('./tied-pants.prod.min.js')
}
