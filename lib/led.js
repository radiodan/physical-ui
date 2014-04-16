
/*
  Simple LED class
  <pin>           pin number (wiring pi scheme)
  <opts.reverse>  0 is on, 1 is off
*/
function create(pin, opts) {
  var instance = {},
      opts = opts || {},
      reverse = opts.reverse,
      wpi = opts.wpi,
      values;

  if (reverse) {
    values = { on: 0, off: 1 };
  } else {
    values = { on: 1, off: 0 };
  }

  if (!wpi) {
    wpi = require('wiring-pi');
  }

  wpi.setup();
  wpi.pinMode(pin, wpi.OUTPUT);

  instance.on = function () {
    wpi.digitalWrite(pin, values.on);
    return instance;
  };

  instance.off = function () {
    wpi.digitalWrite(pin, values.off);
    return instance;
  };

  instance.destroy = function () {
    instance.off();
    // no `this` since LED should be unusuable
  };

  instance.off();

  return instance;
};

module.exports.create = create;
