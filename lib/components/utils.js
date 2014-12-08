/* jshint white: false, latedef: nofunc, browser: true, devel: true */
'use strict';

var _ = require('lodash');

module.exports = {
  easeFunctionNameResolver: function (name, fns) {
    var matches = /ease(InOut|In|Out)(Sin|.*)/.exec(name),
        direction = matches && matches[1],
        type = matches && matches[2],
        candidate,
        typeIndex;

    if (name == 'linear') {
      direction = 'None';
      type = 'Linear';
    }

    if (direction && type) {
      candidate = _.find(
        fns,
        function (value, key) { return key.match(type); }
      );

      if (candidate && candidate[direction]) {
        return candidate[direction];
      }
    }

    return null;
  },
  debounce: function debounce(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  },
  throttle: function throttle(fn, threshhold, scope) {
    threshhold = threshhold || (threshhold = 250);
    var last,
        deferTimer;
    return function () {
      var context = scope || this;

      var now = +new Date(),
          args = arguments;
      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  },
  clone: function (source, sanitise) {
    if (sanitise) {
      return JSON.parse( JSON.stringify(source) );
    } else {
      return Object.keys(source)
                   .reduce(function (target, key) {
                     target[key] = source[key];
                     return target;
                   }, {});
    }
  },
  merge: _.merge,
  last: _.last
};
