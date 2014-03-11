var RGB    = require('../lib/rgb'),
    Button = require('../lib/button'),
    RotaryEncoder = require('../lib/rotary-encoder'),
    EventEmitter = require('events').EventEmitter,
    timers = require('timers');

var red   = [255, 0, 0],
    green = [0, 255, 0],
    blue  = [0, 0, 255],
    white = [255, 255, 255];

var MagicDial = function (rgbPins, buttonPin, encoderPins) {
  this.rgbPins   = rgbPins;
  this.buttonPin = buttonPin;

  this.rgb     = new RGB(this.rgbPins, { reverse: true });
  this.button  = new Button(this.buttonPin, { pull: 'down' });
  this.encoder = new RotaryEncoder(encoderPins[0], encoderPins[1]);

  this.button.on('changed', this.handleButton.bind(this));

  this.encoder.on('clockwise', this.up.bind(this));
  this.encoder.on('anticlockwise', this.down.bind(this));

  this.readyState();
};

MagicDial.prototype = Object.create(EventEmitter.prototype);

MagicDial.prototype.handleButton = function () {
  if (this.button.isPressed()) {
    this.performAction();
  }
};

MagicDial.prototype.readyState = function () {
  this.rgb.colour(white);
};

MagicDial.prototype.performAction = function () {
  this.rgb.colour(blue);
  timers.setTimeout(this.readyState.bind(this), 1000);
};

MagicDial.prototype.up = function () {
  this.rgb.colour(green);
};

MagicDial.prototype.down = function () {
  this.rgb.colour(red);
};

MagicDial.prototype.destroy = function () {
  this.rgb.destroy();
  this.button.destroy();
};

module.exports = MagicDial;
