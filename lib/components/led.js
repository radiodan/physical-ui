var clone = require('./utils').clone,
    merge = require('./utils').merge,
    TWEEN = require('tween.js'),
    tick  = require('animation-loops'),
    promise = require('radiodan-client').utils.promise;

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
      activeTween = null,
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

  function write(value) {
    if (isPwm) {
      wpi.softPwmWrite(pin, pwmValue(value));
    } else {
      wpi.digitalWrite(pin, (value === 0 ? values.off : values.on));
    }
    brightness = value;
  }

  instance.on = function () {
    return instance.brightness(100);
  };

  instance.off = function () {
    return instance.brightness(0);
  };

  instance.brightness = function (value, isTransitioning) {
    var initialValue = values.off * pwmRange,
        dfd = promise.defer();

    if (typeof value === 'undefined') {
      return brightness;
    }

    if (isPwm && brightness === value) {
      return promise.resolve();
    }

    if (!isPwm && (value === 0 || value === 100) && !globalTransitions.duration) {
      write(value);
    } else if (!isPwm) {
      wpi.softPwmCreate(pin, initialValue, pwmRange);
      isPwm = true;
    }

    if (globalTransitions.duration && !isTransitioning) {
      if (activeTween) {
        activeTween.stop();
      }
      activeTween = new tween.Tween({ value: brightness })
                .to({ value: value }, globalTransitions.duration)
                .onUpdate(function () {
                  instance.brightness(Math.round(this.value), true);
                })
                .onComplete(function () {
                  dfd.resolve();
                })
                .onStop(function () {
                  dfd.reject();
                })
                .start();

      startTimer();
    } else if (isPwm) {
      write(value);
    }

    return dfd.promise;
  };

  instance.transitions = function (params) {
    if (params == null) {
      return clone(globalTransitions);
    }

    globalTransitions = merge(globalTransitions, params);
  }

  instance.destroy = function () {
    return instance.off();
  };

  return instance;
};

module.exports.create = create;
