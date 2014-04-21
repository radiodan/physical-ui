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
      pollIntervalMs = 5, 
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
    if (!(direction === null || direction === 'clockwise' || direction === 'anticlockwise') ) {
      throw new Error('readState must return "clockwise", "anticlockwise" or "null"');
    }
    if (direction) {
      instance.emit('turn', { direction: direction });
    }
    scheduleUpdateWithTimer(readAndBroadcastStateWithPolling, pollIntervalMs, timer);
  }

  function destroy() {

  }

  instance.readState = createDefaultReadState();
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

function createDefaultReadState(pinA, pinB, wpi) {
  var lastVal  = 0,
      position = 0;

  return function readState() {
    var msb = wpi.digitalRead(pinA),
        lsb = wpi.digitalRead(pinB),
        encoded = (msb << 1) | lsb,
        direction = null,
        sum;

    sum = (lastVal << 2) | encoded;

    if (sum == b('1101') || sum == b('0100') || sum == b('0010') || sum == b('1011')) {
      position += 1;
      direction = 'clockwise';
    }

    if (sum == b('1110') || sum == b('0111') || sum == b('0001') || sum == b('1000')) {
      position -= 1;
      direction = 'anticlockwise';
    }

    lastVal = encoded;

    return direction;
  };
}

// str -> binary
function b(str) {
  return parseInt(str, 2);
}

module.exports.create = create;
module.exports.algorithms = {
  'default': createDefaultReadState
};