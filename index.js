'use strict';
var isDevelopment = process === Object(process) && process.env === Object(process.env) ?
    process.env.NODE_ENV !== 'production' :
    false;

if (isDevelopment) {
  module.exports = require('./lib/dev.js');
} else {
  module.exports = require('./lib/prod.js');
}
