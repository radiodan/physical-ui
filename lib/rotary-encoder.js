var EventEmitter = require('events').EventEmitter,
    utils = require('./utils');

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
      updateMethod = opts.updateMethod,
      algorithm = opts.algorithm,
      history = [],
      historyCount = 4;

  if (!wpi) {
    wpi = require('wiring-pi');
  }

  if (!timer) {
    timer = require('timers').setTimeout;
  }

  if (!algorithm) {
    algorithm = module.exports.algorithms.default;
  }

  if (!updateMethod) {
    updateMethod = 'polling';
  }

  function init() {
    instance.readState = algorithm(pinA, pinB, wpi);

    wpi.setup();

    wpi.pinMode(pinA, wpi.INPUT);
    configurePullForPin(pinA, opts.pullA, wpi)

    wpi.pinMode(pinB, wpi.INPUT);
    configurePullForPin(pinB, opts.pullB, wpi);
  }

  function readAndBroadcastState() {
    var direction = instance.readState(pinA, pinB, wpi);
    if (typeof direction !== 'number') {
      throw new Error('readState must return an integer');
    }
    
    if (direction === 0) {
      history = [];
    } else {
      history.push(direction);
    }

    if (history.length % historyCount === 0) {
      var text = directionText(directionFromHistory(history));
      if (text) { instance.emit('turn', { direction: text }); }
    }
  }

  function directionFromHistory(history) {
    var dir = 0;
    for(var i = history.length - 1, len = historyCount; i >= 0; i--) {
      dir += history[i];
    }
    if (dir > 0) {
      return 1;
    } else if (dir < 0) {
      return -1;
    } else {
      return 0;
    }
  }

  function readAndBroadcastStateWithPolling() {
    readAndBroadcastState();
    scheduleUpdateWithTimer(readAndBroadcastStateWithPolling, pollIntervalMs, timer);
  }

  function readAndBroadcastStateWithInterrupt() {
    // wpi.wiringPiISR(pin, wpi.INT_EDGE_BOTH, debounce(instance.handleEvent, 50) );
    wpi.wiringPiISR( pinA, wpi.INT_EDGE_RISING, readAndBroadcastState );
    wpi.wiringPiISR( pinB, wpi.INT_EDGE_RISING, readAndBroadcastState );
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

  if (updateMethod === 'polling') {
    readAndBroadcastStateWithPolling();
  } else if (updateMethod === 'interrupt') {
    readAndBroadcastStateWithInterrupt();
  } else {
    throw Error('Invalid updateMethod defined, use opts.updateMethod');
  }

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