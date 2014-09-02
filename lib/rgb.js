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
      var value = rgb[index];
      pin.brightness( rgbToPercentage(value) );
    });
  };

  instance.destroy = function () {
    pins.forEach(function (pin) { pin.destroy(); });
  };

  instance.off();

  return instance;
}

/*
  e.g. 30/255 -> ?/100
    = scale(30, 255, 100)
    = 11.764705882
*/
function scale(val, domain, range) {
  return (val / domain ) * range
}

function rgbToPercentage(value) {
  return Math.round( scale(value, 255, 100) );
}

module.exports.create = create;


var RGB = function (rgb, opts) {
  opts = opts || {};

  this.pins = rgb.map(createLEDMakerWithOpts(opts));

  this.off();
};