var wpi = require('wiring-pi');

function wrapObjectWithFn(obj, fn) {
  var instance = {};

  Object.keys(obj).forEach(function (name) {
    var original = wpi[name];
    if (typeof original === 'function') {
      instance[name] = fn(name);
    } else {
      instance[name] = original;
    }
  });

  return instance;
}

module.exports.create = function (fn) {
  return wrapObjectWithFn(wpi, fn || createBasicLogger);
};

function createBasicLogger(name) {
  return function () {
    console.log(name);
    console.log.apply(null, arguments);
  }
}