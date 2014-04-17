var LED = require('./led');

function createLEDMakerWithOpts(LED, opts) {
  return function createLED(pin) {
    return LED.create(pin, opts);
  };
}

/*
  Simple RGB LED class
  [r, g, b]       pin numbers for Red, Green, Blue LEDs (wiring pi scheme)
  <opts.reverse>  0 is on, 1 is off (common anode)
*/
function create(rgb, opts) {
  var instance = {},
      opts = opts || {},
      LED = opts.LED,
      pins;

  // Don't pass through to LED instances
  delete opts.LED;

  if (!LED) {
    LED = require('./led');
  }

  pins = rgb.map(createLEDMakerWithOpts(LED, opts));

  instance.on = function () {
    pins.forEach(function (pin) { pin.on(); });
    return this;
  };

  instance.off = function () {
    pins.forEach(function (pin) { pin.off(); });
    return this;
  };

  /*
    [r, g, b] Array of colour values for red, green, blue
              Only full-colour is currently possible
  */
  instance.colour = function (rgb) {
    pins.forEach(function (pin, index) {
      (rgb[index] === 0) ? pin.off() : pin.on();
    });
  };

  instance.destroy = function () {
    pins.forEach(function (pin) { pin.destroy(); });
  };

  instance.off();

  return instance;
}

module.exports.create = create;


var RGB = function (rgb, opts) {
  opts = opts || {};

  this.pins = rgb.map(createLEDMakerWithOpts(opts));

  this.off();
};