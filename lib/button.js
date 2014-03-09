var wpi = require('wiring-pi'),
    EventEmitter = require('events').EventEmitter;

/*
  Simple Button class
  <pin>           pin number (wiring pi scheme)
  <opts.pull>     'up' enable pull-up resistor
                  'down' enable pull-down resistor
*/
var Button = function (pin, opts) {
  opts = opts || {};

  this.pin = pin;

  this.values = { pressed: 1, released: 0 };

  wpi.setup();

  switch(opts.pull) {
    case 'up'   : wpi.pullUpDnControl(this.pin, wpi.PUD_UP);
                  break;
    case 'down' : wpi.pullUpDnControl(this.pin, wpi.PUD_DOWN);
                  break;
  }

  wpi.pinMode(this.pin, wpi.INPUT);

  wpi.wiringPiISR(this.pin, wpi.INT_EDGE_BOTH, this.handleEvent.bind(this));
};

Button.prototype = Object.create(EventEmitter.prototype);

Button.prototype.handleEvent = function () {
  this.emit('changed');
};

Button.prototype.state = function () {
  return wpi.digitalRead(this.pin);
};

Button.prototype.isPressed = function () {
  return this.state() === this.values.pressed;
};

Button.prototype.isReleased = function () {
  return this.state() === this.values.released;
};

Button.prototype.destroy = function () {
  // Doesn't do anything yet
};


module.exports = Button;
