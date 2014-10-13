var clone = require('./utils').clone,
    merge = require('./utils').merge,
    TWEEN = require('tween.js'),
    tick  = require('animation-loops');

// Shared between all LEDs
var transitionUpdateInterval = 50,
    timer;

function startTimer() {
  if (!timer) {
    var lastTick;
    timer = tick.add(function( elapsed, delta, stop ){
      if (!lastTick || ((elapsed - lastTick) > transitionUpdateInterval)) {
        lastTick = elapsed;
        TWEEN.update();
      }
    });
  }
}

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
      tween = opts.tween || TWEEN,
      isPwm = false,
      brightness = 0,
      pwmRange = 100,
      globalTransitions = {},
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

  instance.brightness = function (value, isTransitioning) {
    var initialValue = values.off * pwmRange;

    if (typeof value === 'undefined') {
      return brightness;
    }

    if (isPwm && brightness === value) {
      return instance;
    }

    if (!isPwm && (value === 0 || value === 100) && !globalTransitions.duration) {
      wpi.digitalWrite(pin, (value === 0 ? values.off : values.on));
    } else if (!isPwm) {
      wpi.softPwmCreate(pin, initialValue, pwmRange);
      isPwm = true;
    }

    if (globalTransitions.duration && !isTransitioning) {
      new tween.Tween({ value: brightness })
                .to({ value: value }, globalTransitions.duration)
                .onUpdate(function () {
                  instance.brightness(Math.round(this.value), true);
                })
                .start();

      startTimer();

      return instance;
    }

    if (isPwm) {
      wpi.softPwmWrite(pin, pwmValue(value));
    }

    brightness = value;

    return instance;
  };

  instance.transitions = function (params) {
    if (params == null) {
      return clone(globalTransitions);
    }

    globalTransitions = merge(globalTransitions, params);
  }

  instance.destroy = function () {
    instance.off();
    // no `this` since LED should be unusuable
  };

  return instance;
};

module.exports.create = create;
