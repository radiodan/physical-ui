var RGB    = require('../lib/rgb'),
    Button = require('../lib/button'),
    RotaryEncoder = require('../lib/rotary-encoder'),
    EventEmitter = require('events').EventEmitter;

var red   = [255, 0, 0],
    green = [0, 255, 0];

var StatusControl = function (rgbPins, buttonPin, encoderPins) {
  this.rgbPins   = rgbPins;
  this.buttonPin = buttonPin;

  this.rgb     = new RGB(this.rgbPins, { reverse: true });
  this.button  = new Button(this.buttonPin, { pull: 'down' });
  this.encoder = new RotaryEncoder(encoderPins[0], encoderPins[1]);

  this.button.on('changed', this.handleButton.bind(this));

  this.encoder.on('clockwise', this.volumeUp.bind(this));
  this.encoder.on('anticlockwise', this.volumeDown.bind(this));

  this.turnOff();
};

StatusControl.prototype = Object.create(EventEmitter.prototype);

StatusControl.prototype.handleButton = function () {
  if (this.button.isPressed()) {
    this.toggleState();
  }
};

StatusControl.prototype.turnOn = function () {
  this.isOn = true;
  this.rgb.colour(green);
};

StatusControl.prototype.turnOff = function () {
  this.isOn = false;
  this.rgb.colour(red);
};

StatusControl.prototype.toggleState = function () {
  this.isOn ? this.turnOff() : this.turnOn();
};

StatusControl.prototype.volumeUp = function () {
  if (this.isOn) {
    console.log('+5');
  }
};

StatusControl.prototype.volumeDown = function () {
  if (this.isOn) {
    console.log('-5');
  }
};

StatusControl.prototype.destroy = function () {
  this.rgb.destroy();
  this.button.destroy();
};

module.exports = StatusControl;
