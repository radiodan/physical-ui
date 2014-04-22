var EventEmitter = require('events').EventEmitter;

/*
  Simple RotaryEncoder class
  <pinA>         pin A number (wiring pi scheme)
  <pinB>         pin B number (wiring pi scheme)
  <opts.pull>    'up' enable pull-up resistor
                 'down' enable pull-down resistor
*/
function create(pinA, pinB, opts) {
  opts = opts || {};
  var instance = new EventEmitter(),
      wpi = opts.wpi, 
      pollIntervalMs = 1, 
      timer = opts.timer,
      algorithm = opts.algorithm;

  if (!wpi) {
    wpi = require('wiring-pi');
  }

  if (!timer) {
    timer = require('timers').setTimeout;
  }

  if (!algorithm) {
    algorithm = module.exports.algorithms.default;
  }

  function init() {
    instance.readState = algorithm(pinA, pinB, wpi);

    wpi.setup();

    wpi.pinMode(pinA, wpi.INPUT);
    configurePullForPin(pinA, opts.pullA, wpi)

    wpi.pinMode(pinB, wpi.INPUT);
    configurePullForPin(pinB, opts.pullB, wpi);
  }

  function readAndBroadcastStateWithPolling() {
    var direction = instance.readState(pinA, pinB, wpi);
    if (typeof direction !== 'number') {
      throw new Error('readState must return an integer');
    }
    if (direction) {
      instance.emit('turn', { direction: directionText(direction) });
    }
    scheduleUpdateWithTimer(readAndBroadcastStateWithPolling, pollIntervalMs, timer);
  }

  function directionText(num) {
    if (num > 0) {
      return 'clockwise';
    } else if (num < 0) {
      return 'anticlockwise';
    }
  }

  function destroy() {

  }

  instance.destroy   = destroy;

  init();
  readAndBroadcastStateWithPolling();

  return instance;
}

function scheduleUpdateWithTimer(callback, intervalMs, timer) {
  timer(callback, intervalMs);
}

function configurePullForPin(pin, direction, wpi) {
  switch(direction) {
    case 'up':    wpi.pullUpDnControl(pin, wpi.PUD_UP);
                  break;
    case 'down':  wpi.pullUpDnControl(pin, wpi.PUD_DOWN);
                  break;
  }  
}

module.exports.create = create;
module.exports.algorithms = {
  'default': require('./rotary-encoder/default'),
  'delta': require('./rotary-encoder/delta')
};