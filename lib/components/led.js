var utils = require('./utils'),
    clone = utils.clone,
    merge = utils.merge,
    easeFn= utils.easeFunctionNameResolver,
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

function stopAllTweens(tweens) {
  return tweens.forEach(stopTween);
}

function stopTween(tween) {
  return tween.stop();
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
      activeTweens = [],
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

  instance.on = function (transition) {
    return instance.brightness(100, transition);
  };

  instance.off = function (transition) {
    return instance.brightness(0, transition);
  };

  function repeatValue(transition) {
    var val = null;

    if (transition.repeat === true || transition.yoyo === true) {
      val = Infinity;
    } else if (typeof transition.repeat === 'number') {
      val = transition.repeat;
    }

    return val;
  }

  function yoyoValue(transition) {
    var val = false;
    if (transition.yoyo === true || typeof transition.yoyo === 'number') {
      val = true;
    }
    return val;
  }

  function easingValue(transition) {
    var easing = transition.easing,
        fn = null;

    if (typeof easing === 'function') {
      fn = easing;
    } else {
      fn = easeFn(easing, tween.Easing);
    }

    return fn;
  }

  // Return a safe merged object without
  // modifying the parameter objects
  function transitions(local, defaults) {
    return merge( clone(defaults || {}), clone(local || {}) );
  }

  instance.brightness = function (value, localTransition, isTransitioning) {
    var initialValue = values.off * pwmRange,
        dfd = promise.defer(),
        transition = transitions(localTransition, globalTransitions);

    if (typeof value === 'undefined') {
      return brightness;
    }

    if (isPwm && brightness === value) {
      return promise.resolve();
    }

    if (!isPwm && (value === 0 || value === 100) && !transition.duration) {
      write(value);
    } else if (!isPwm) {
      wpi.softPwmCreate(pin, initialValue, pwmRange);
      isPwm = true;
    }

    if (transition.duration && !isTransitioning) {
      if (activeTweens.length > 0) {
        stopAllTweens(activeTweens);
      }
      newTween = new tween.Tween({ value: brightness })
                .to({ value: value }, transition.duration)
                .repeat(repeatValue(transition))
                .yoyo(yoyoValue(transition))
                .onUpdate(function () {
                  instance.brightness(Math.round(this.value), transition, true);
                })
                .onComplete(function () {
                  dfd.resolve();
                })
                .onStop(function () {
                  dfd.reject();
                });

      activeTweens.push(newTween);

      var easing = easingValue(transition);
      if (easing) {
        newTween.easing(easing);
      }

      newTween.start();

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
