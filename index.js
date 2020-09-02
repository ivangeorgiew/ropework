'use strict';
var isDevelopment = process === Object(process) && process.env === Object(process.env) ?
    process.env.NODE_ENV !== 'production' :
    false;

if (isDevelopment) {
  module.exports = require('.source.js');
} else {
  module.exports = require('.source.min.js');
}
