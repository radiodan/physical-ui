'use strict';

var EventEmitter = require('events').EventEmitter;

var debounce = require('./utils').debounce;

/*
  Simple Button class
  <pin>           pin number (wiring pi scheme)
  <opts.pull>     'up' enable pull-up resistor
                  'down' enable pull-down resistor
  <opts.holdTimeMs> Number of ms to wait before firing
                    a `hold` event after being pressed.
*/
function create(pin, opts) {
  var instance = new EventEmitter(),
      opts     = opts || {},
      pressed  = 1,
      wpi      = opts.wpi,
      holdInterval = opts.holdTimeMs || 1000,
      pressStartTime,
      holdTimeoutId;

  if (opts.pressedIsHigh != null) {
    pressed = opts.pressedIsHigh ? 1 : 0;
  }

  if (!wpi) {
    wpi = require('wiring-pi');
  }

  function init() {
    wpi.setup();

    switch(opts.pull) {
      case 'up'   : wpi.pullUpDnControl(pin, wpi.PUD_UP);
                    break;
      case 'down' : wpi.pullUpDnControl(pin, wpi.PUD_DOWN);
                    break;
    }

    wpi.pinMode(pin, wpi.INPUT);
    wpi.wiringPiISR(pin, wpi.INT_EDGE_BOTH, debounce(instance.handleEvent, 50) );
  }

  instance.handleEvent = function () {
    instance.emit('change');
    if (instance.isPressed()) {
      pressStartTime = Date.now();
      scheduleHoldTimeout();
      instance.emit('press');
    } else {
      pressStartTime = null;
      expireHoldTimeout();
      instance.emit('release');
    }
  };

  instance.handleHold = function () {
    var holdDurationMs = Date.now() - pressStartTime;
    expireHoldTimeout();
    scheduleHoldTimeout();
    instance.emit('hold', { holdDurationMs: holdDurationMs });
  };

  function scheduleHoldTimeout() {
    if (holdTimeoutId) {
      console.warn('holdTimeout already scheduled');
      return;
    }
    holdTimeoutId = setTimeout(
      instance.handleHold, holdInterval
    );
  }

  function expireHoldTimeout() {
    if (holdTimeoutId) {
      clearTimeout(holdTimeoutId);
      holdTimeoutId = null;
    }
  }

  instance.state = function () {
    return wpi.digitalRead(pin);
  };

  instance.isPressed = function () {
    return !!instance.state() === !!pressed;
  };

  instance.isReleased = function () {
    return !!instance.state() !== !!pressed;
  };

  instance.destroy = function () {
    // Doesn't do anything yet
  };

  init();

  return instance;
};

module.exports.create = create;
