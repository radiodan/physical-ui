var LED = require('./led');

function createLEDMakerWithOpts(opts) {
  return function createLED(pin) {
    return new LED(pin, opts);
  };
}

/*
  Simple RGB LED class
  [r, g, b]       pin numbers for Red, Green, Blue LEDs (wiring pi scheme)
  <opts.reverse>  0 is on, 1 is off (common anode)
*/
var RGB = function (rgb, opts) {
  opts = opts || {};

  this.pins = rgb.map(createLEDMakerWithOpts(opts));

  this.off();
};

/*
  [r, g, b] Array of colour values for red, green, blue
            Only full-colour is currently possible
*/
RGB.prototype.colour = function (rgb) {
  this.pins.forEach(function (pin, index) {
    (rgb[index] === 0) ? pin.off() : pin.on();
  });
};

RGB.prototype.on = function () {
  this.pins.forEach(function (pin) { pin.on(); });
  return this;
};

RGB.prototype.off = function () {
  this.pins.forEach(function (pin) { pin.off(); });
  return this;
};

RGB.prototype.destroy = function () {
  this.pins.forEach(function (pin) { pin.destroy(); });
};

module.exports = RGB;
