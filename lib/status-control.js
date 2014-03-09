var RGB    = require('../lib/rgb'),
    Button = require('../lib/button'),
    EventEmitter = require('events').EventEmitter;

var red   = [255, 0, 0],
    green = [0, 255, 0];

var StatusControl = function (rgbPins, buttonPin) {
  this.rgbPins   = rgbPins;
  this.buttonPin = buttonPin;

  this.rgb = new RGB(this.rgbPins, { reverse: true });
  this.button = new Button(this.buttonPin, { pull: 'down' });

  this.button.on('changed', this.handleButton.bind(this));

  this.turnOff();
};

StatusControl.prototype = new EventEmitter();

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

StatusControl.prototype.destroy = function () {
  this.rgb.destroy();
  this.button.destroy();
};

module.exports = StatusControl;
