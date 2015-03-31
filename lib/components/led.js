var utils = require('./utils'),
    clone = utils.clone,
    merge = utils.merge,
    last  = utils.last,
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
  tweens.forEach(stopTween);
  return [];
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
      brightness = null,
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

  wpi.setup('wpi');
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

  // Enable software-defined PWM on a pin.
  // This uses 0.5% CPU per pin
  function setupPwm() {
    var initialValue = values.off * pwmRange;
    wpi.softPwmCreate(pin, initialValue, pwmRange);
    isPwm = true;
  }

  instance.brightness = function (value, localTransition) {
    var transition = transitions(localTransition, globalTransitions),
        needsPwm   = (transition.duration != null) || (value != 0 && value != 100),
        pwmReady   = isPwm;

    // Get current brightness
    if (typeof value === 'undefined') {
      return brightness;
    }

    // Do nothing if target brightness is same as current
    // And we're not chaining a transition
    if (!transition.chain && brightness === value) {
      return promise.resolve();
    }

    // Can do an immediate, digital write?
    if (!needsPwm && !pwmReady) {
      write(value);
      return promise.resolve();
    }

    if (!pwmReady) {
      setupPwm();
    }

    if (transition.chain) {
      return createAndChainTween(value, transition);
    } else {
      return createAndStartTween(value, transition);
    }
  }

  function createAndStartTween(target, transition) {
    return createTween(target, transition, false /* shouldChain */);
  }

  function createAndChainTween(target, transition) {
    return createTween(target, transition, true /* shouldChain */);
  }

  function createTween(target, transition, shouldChain) {
    var dfd = promise.defer(),
        newTween,
        previousTween,
        startValue,
        easing;

    if (shouldChain) {
      previousTween = last(activeTweens);
      startValue = previousTween.targetValue;
    } else {
      activeTweens = stopAllTweens(activeTweens);
      startValue = brightness;
    }

    newTween = new tween.Tween({ value: startValue })
                .to({ value: target }, transition.duration)
                .repeat(repeatValue(transition))
                .yoyo(yoyoValue(transition))
                .onUpdate(function () {
                  write( Math.round(this.value) );
                })
                .onComplete(function () {
                  dfd.resolve();
                })
                .onStop(function () {
                  dfd.reject();
                });

    newTween.targetValue = target;

    easing = easingValue(transition);
    if (easing) {
      newTween.easing(easing);
    }

    activeTweens.push(newTween);

    if (shouldChain) {
      previousTween.chain(newTween);
    } else {
      newTween.start();
    }

    startTimer();

    return dfd.promise;
  }

  instance.transitions = function (params) {
    if (params == null) {
      return clone(globalTransitions);
    }

    globalTransitions = merge(globalTransitions, params);
  }

  instance.destroy = function () {
    return instance.off();
  };

  // Initially, turn light off
  instance.off();

  return instance;
};

module.exports.create = create;
