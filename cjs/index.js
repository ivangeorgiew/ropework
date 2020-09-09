'use strict';

const isObject = val => typeof val === 'object' && !Array.isArray(val) && val !== null;
const isDevelopment = isObject(process) && isObject(process.env) ? process.env.NODE_ENV !== 'production' : false;

if (isDevelopment) {
  module.exports = require('./tied-pants.dev.js');
} else {
  module.exports = require('./tied-pants.prod.min.js');
}
