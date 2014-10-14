var LED = require('./led'),
    promise = require('radiodan-client').utils.promise;

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
    return promise.all(
      pins.map(function (pin) {
        return pin.on();
      })
    );
  };

  instance.off = function () {
    return promise.all(
      pins.forEach(function (pin) {
        return pin.off();
      })
    );
  };

  /*
    [r, g, b] Array of colour values for red, green, blue
              Only full-colour is currently possible
  */
  instance.colour = function (rgb) {
    return promise.all(
      pins.map(function (pin, index) {
        var value = rgb[index];
        return pin.brightness( rgbToPercentage(value) );
      })
    );
  };

  instance.transitions = function (params) {

    if (params == null) {
      return pins[0].transitons();
    }

    pins.forEach(function (pin, index) {
      pin.transitions(params);
    });
  }

  instance.destroy = function () {
    return promise.all(
      pins.map(function (pin) { return pin.destroy(); })
    );
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