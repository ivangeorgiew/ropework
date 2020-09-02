'use strict';

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var getErrorHandling = function getErrorHandling(params) {
  //start constants definitions
  var isObject = function isObject(val) {
    return typeof val !== 'function' && val === Object(val);
  };

  var isBrowser = typeof window !== 'undefined' && {}.toString.call(window) === '[object Window]';
  var isNodeJS = typeof global !== 'undefined' && {}.toString.call(global) === '[object global]';
  var defaultLogger = isObject(console) && typeof console.error === 'function' ? console.error : function () {};
  var defaultDescr = 'a part of the application';
  var browserEventNames = ['error', 'unhandledrejection'];
  var nodeEventNames = ['uncaughtException', 'unhandledRejection', 'SIGTERM', 'SIGINT']; //end constants definitions
  //start configuring arguments

  params = isObject(params) ? params : {};
  var isDevelopment = typeof params.isDevelopment === 'boolean' ? params.isDevelopment : isObject(process) && isObject(process.env) ? process.env.NODE_ENV !== 'production' : false;
  var devErrorLogger = typeof params.devErrorLogger === 'function' ? function () {
    for (var _len = arguments.length, args = new Array(_len), _key2 = 0; _key2 < _len; _key2++) {
      args[_key2] = arguments[_key2];
    }

    try {
      params.devErrorLogger.apply(this, args);
    } catch (err) {
      if (isDevelopment) {
        defaultLogger(" Issue with: parameter devErrorLogger\n", err);
        defaultLogger.apply(this, args);
      }
    }
  } : defaultLogger;
  var onError = typeof params.onError === 'function' ? function () {
    try {
      for (var _len2 = arguments.length, args = new Array(_len2), _key3 = 0; _key3 < _len2; _key3++) {
        args[_key3] = arguments[_key3];
      }

      params.onError.apply(this, args);
    } catch (err) {
      if (isDevelopment) {
        devErrorLogger(" Issue with: parameter onError\n", err);
      }
    }
  } : function () {}; //end configuring arguments

  var stringifyAll = function stringifyAll(data) {
    try {
      var parser = function parser(_key, val) {
        if (val instanceof Error) {
          return Object.getOwnPropertyNames(val).reduce(function (acc, key) {
            acc[key] = val[key];
            return acc;
          }, {
            stack: val.stack
          });
        }

        if (typeof val === 'function') {
          return '[function]';
        }

        return val;
      };

      return JSON.stringify(data, parser);
    } catch (err) {
      return JSON.stringify('[object Cyclic]');
    }
  };

  var getErrorInfo = function getErrorInfo(params) {
    params = isObject(params) ? params : {};
    var isUncaught = typeof params.descr === 'boolean' ? params.descr : false;
    var descr = typeof params.descr === 'string' ? params.descr : isUncaught ? 'unexpected error, plese reload...' : defaultDescr;

    try {
      var err = params.err instanceof Error ? params.err : new Error('Unknown error');
      var args = Array.isArray(params.args) ? params.args.map(function (el) {
        return JSON.parse(stringifyAll(el));
      }) : ['[unknown]'];
      var stringOfArgs = args.reduce(function (acc, arg, idx) {
        var stringifiedArg = stringifyAll(arg);
        return idx === 0 ? "".concat(acc, " ").concat(stringifiedArg) : "".concat(acc, " , ").concat(stringifiedArg);
      }, '');

      if (isDevelopment) {
        devErrorLogger(" Issue with: ".concat(descr, "\n Function arguments: ").concat(stringOfArgs, "\n"), err);
      }

      var commonProps = {
        description: descr,
        arguments: args,
        date: new Date().toUTCString(),
        error: err
      };
      var productionMsg = stringifyAll(commonProps);

      if (isBrowser) {
        productionMsg = stringifyAll(_objectSpread(_objectSpread({}, commonProps), {}, {
          localUrl: window.location.href,
          machineInfo: {
            browserInfo: window.navigator.userAgent,
            language: window.navigator.language,
            osType: window.navigator.platform
          }
        }));
      }

      if (isNodeJS) {
        productionMsg = stringifyAll(_objectSpread(_objectSpread({}, commonProps), {}, {
          localUrl: __filename,
          machineInfo: {
            cpuArch: process.arch,
            osType: process.platform,
            depVersions: process.versions
          }
        }));
      }

      return {
        description: descr,
        productionMsg: productionMsg
      };
    } catch (err) {
      if (isDevelopment) {
        devErrorLogger(" Issue with: error logger\n", err);
      }

      return {
        description: descr,
        productionMsg: stringifyAll({
          description: descr,
          error: err
        })
      };
    }
  };

  var createFunc = function createFunc(descr, onTry, onCatch) {
    var shouldHandleArgs = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    try {
      if (typeof onTry !== 'function') {
        getErrorInfo({
          err: new Error("Instead of function was given ".concat(onTry))
        });
        return function () {};
      }

      var innerCatch = function innerCatch(err, args) {
        onError(getErrorInfo({
          descr: descr,
          err: err,
          args: args
        }));

        if (typeof onCatch === 'function') {
          return createFunc("catching errors for ".concat(descr), onCatch).call(this, {
            descr: descr,
            err: err,
            args: args
          });
        }
      };

      return function () {
        var _this = this;

        for (var _len3 = arguments.length, args = new Array(_len3), _key4 = 0; _key4 < _len3; _key4++) {
          args[_key4] = arguments[_key4];
        }

        try {
          if (shouldHandleArgs) {
            args = args.map(function (el) {
              return typeof el === 'function' ? createFunc("argument of ".concat(descr), el, onCatch) : el;
            });
          }
        } catch (err) {
          getErrorInfo({
            descr: 'error handling function arguments',
            err: err
          });
        }

        try {
          var result = onTry.apply(this, args); //if the function returns a promise

          if (isObject(result) && typeof result["catch"] === 'function') {
            return result["catch"](function (err) {
              return innerCatch.apply(_this, [err, args]);
            });
          }

          return result;
        } catch (err) {
          return innerCatch.apply(this, [err, args]);
        }
      };
    } catch (err) {
      getErrorInfo({
        descr: 'error handling function',
        err: err
      });
      return typeof onTry === 'function' ? onTry : function () {};
    }
  };

  var createData = createFunc('creating error handled data', function () {
    for (var _len4 = arguments.length, args = new Array(_len4), _key5 = 0; _key5 < _len4; _key5++) {
      args[_key5] = arguments[_key5];
    }

    var descr = args[0],
        data = args[1],
        onCatch = args[2];

    if (typeof descr !== 'string') {
      descr = defaultDescr;
      data = args[0];
      onCatch = args[1];
    }

    if (Array.isArray(data)) {
      return data.map(function (el, idx) {
        return createData("element ".concat(idx, " of ").concat(descr), el, onCatch);
      });
    }

    if (typeof data === 'function' || isObject(data)) {
      var shouldHandleArgs = true;
      var handledData = typeof data === 'function' ? createFunc(descr, data, onCatch, shouldHandleArgs) : {};
      var descriptors = Object.getOwnPropertyDescriptors(data);
      Object.keys(descriptors).forEach(function (key) {
        var _data;

        if (!descriptors[key].configurable) {
          return;
        }

        var value = typeof data[key] === 'function' ? createFunc("method ".concat(key), data[key], (_data = data[key + 'Catch']) !== null && _data !== void 0 ? _data : onCatch, shouldHandleArgs).bind(data) : data[key];
        Object.defineProperty(handledData, key, Object.assign(descriptors[key], descriptors[key].hasOwnProperty('value') ? {
          value: value
        } : null));
      });
      return handledData;
    }

    return data;
  }, function (_ref) {
    var _ref$args = _slicedToArray(_ref.args, 2),
        descr = _ref$args[0],
        data = _ref$args[1];

    return typeof descr === 'string' ? data : descr;
  });
  var errorListener = createFunc('listening for unexpected errors', function (eventOrError) {
    if (isBrowser) {
      if (eventOrError instanceof Event) {
        var _eventOrError$reason;

        eventOrError.stopImmediatePropagation();
        eventOrError.preventDefault();
        onError(getErrorInfo({
          isUncaught: true,
          err: (_eventOrError$reason = eventOrError.reason) !== null && _eventOrError$reason !== void 0 ? _eventOrError$reason : eventOrError.error
        }));
      } // prevent user from interacting with the page


      window.document.body.style['pointer-events'] = 'none';
    }

    if (isNodeJS) {
      var exitCode = 0;

      if (eventOrError instanceof Error) {
        exitCode = 1;
        onError(getErrorInfo({
          isUncaught: true,
          err: eventOrError
        }));
      }

      setTimeout(function () {
        process.exit(exitCode);
      }, 1000).unref();
    }
  });
  var initUncaughtErrorHandling = createFunc('initializing listening for unexpected errors', function () {
    if (isBrowser) {
      browserEventNames.forEach(function (eventName) {
        if (typeof window.__errorListener__ === 'function') {
          window.removeEventListener(eventName, window.__errorListener__, true);
        }

        window.addEventListener(eventName, errorListener, true);
      });
      window.__errorListener__ = errorListener;
    }

    if (isNodeJS) {
      nodeEventNames.forEach(function (eventName) {
        if (typeof global.__errorListener__ === 'function') {
          process.removeListener(eventName, global.__errorListener__);
        }

        process.on(eventName, errorListener);
      });
      global.__errorListener__ = errorListener;
    }
  });
  var getHandledServer = createFunc('initializing error handling for server', function (server) {
    server = isObject(server) ? server : {};
    var sockets = new Set();

    if (typeof server.on === 'function') {
      server.removeAllListeners('connection');
      server.on('connection', function (socket) {
        sockets.add(socket);
        socket.on('close', function () {
          sockets["delete"](socket);
        });
      });
    }

    var serverErrorListener = createFunc('handling server closing', function (eventOrError) {
      if (typeof server.close === 'function') {
        server.close();
      }

      sockets.forEach(function (socket) {
        socket.destroy();
      });
    });

    if (isNodeJS) {
      nodeEventNames.forEach(function (eventName) {
        process.prependListener(eventName, serverErrorListener);
      });
    }

    return server;
  }, function (_ref2) {
    var _ref2$args = _slicedToArray(_ref2.args, 1),
        server = _ref2$args[0];

    return server;
  });
  initUncaughtErrorHandling();
  return {
    isDevelopment: isDevelopment,
    devErrorLogger: devErrorLogger,
    onError: onError,
    isObject: isObject,
    isBrowser: isBrowser,
    isNodeJS: isNodeJS,
    stringifyAll: stringifyAll,
    createData: createData,
    getHandledServer: getHandledServer
  };
};

module.exports = getErrorHandling;
