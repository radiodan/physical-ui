var clone = require('./utils').clone,
    merge = require('./utils').merge;

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
      isPwm = false,
      brightness = 0,
      pwmRange = 100,
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

  function pwmValue(value) {
    if (reverse) {
      value = pwmRange - value;
    }
    return value;
  }

  instance.on = function () {
    instance.brightness(100);
    return instance;
  };

  instance.off = function () {
    instance.brightness(0);
    return instance;
  };

  instance.brightness = function (value) {
    var initialValue = values.off * pwmRange;

    if (typeof value === 'undefined') {
      return brightness;
    }

    if (!isPwm && (value === 0 || value === 100)) {
      wpi.digitalWrite(pin, (value === 0 ? values.off : values.on));
    } else if (!isPwm) {
      wpi.softPwmCreate(pin, initialValue, pwmRange);
      isPwm = true;
    }

    if (isPwm) {
      wpi.softPwmWrite(pin, pwmValue(value));
    }

    brightness = value;

    return instance;
  };

  instance.destroy = function () {
    instance.off();
    // no `this` since LED should be unusuable
  };

  return instance;
};

module.exports.create = create;
