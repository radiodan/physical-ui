var wpi = require('wiring-pi');

/*
  Simple LED class
  <pin>           pin number (wiring pi scheme)
  <opts.reverse>  0 is on, 1 is off
*/
var LED = function (pin, opts) {
  opts = opts || {};

  this.pin = pin;
  this.reverse = opts.reverse;

  if (this.reverse) {
    this.values = { on: 0, off: 1 };
  } else {
    this.values = { on: 1, off: 0 };
  }

  wpi.setup();
  wpi.pinMode(this.pin, wpi.OUTPUT);

  this.off();
};

LED.prototype.on = function () {
  wpi.digitalWrite(this.pin, this.values.on);
  return this;
};

LED.prototype.off = function () {
  wpi.digitalWrite(this.pin, this.values.off);
  return this;
};

LED.prototype.destroy = function () {
  this.off();
  // no this since LED should be unusuable
};

module.exports = LED;
