var EventEmitter = require('events').EventEmitter;

var debounce = require('./utils').debounce;

/*
  Simple Button class
  <pin>           pin number (wiring pi scheme)
  <opts.pull>     'up' enable pull-up resistor
                  'down' enable pull-down resistor
*/
function create(pin, opts) {
  var instance = new EventEmitter(),
      opts     = opts || {},
      values   = { pressed: 1, released: 0 },
      wpi      = opts.wpi;

  if (!wpi) {
    wpi = require('wiring-pi');
  }

  wpi.setup();

  switch(opts.pull) {
    case 'up'   : wpi.pullUpDnControl(pin, wpi.PUD_UP);
                  break;
    case 'down' : wpi.pullUpDnControl(pin, wpi.PUD_DOWN);
                  break;
  }

  wpi.pinMode(pin, wpi.INPUT);

  wpi.wiringPiISR(pin, wpi.INT_EDGE_BOTH, debounce(handleEvent, 50) );

  function handleEvent() {
    instance.emit('changed');
  };

  instance.state = function () {
    return wpi.digitalRead(pin);
  };

  instance.isPressed = function () {
    return instance.state() === values.pressed;
  };

  instance.isReleased = function () {
    return instance.state() === values.released;
  };

  instance.destroy = function () {
    // Doesn't do anything yet
  };

  return instance;
};

module.exports.create = create;
