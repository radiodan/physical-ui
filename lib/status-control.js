var request = require('request'),
    timers = require('timers'),
    EventEmitter = require('events').EventEmitter;

var RGB    = require('../lib/rgb'),
    Button = require('../lib/button'),
    RotaryEncoder = require('../lib/rotary-encoder'),
    utils  = require('../lib/utils');

var red   = [255, 0, 0],
    green = [0, 255, 0];

var StatusControl = function (rgbPins, buttonPin, encoderPins) {
  this.rgbPins   = rgbPins;
  this.buttonPin = buttonPin;

  this.rgb     = new RGB(this.rgbPins, { reverse: true });
  this.button  = new Button(this.buttonPin, { pull: 'down' });
  this.encoder = new RotaryEncoder(encoderPins[0], encoderPins[1]);

  this.button.on('changed', this.handleButton.bind(this));

  /*
  this.encoder.on(
    'clockwise',
    utils.debounce(this.volumeUp.bind(this), 500)
  );
  this.encoder.on(
    'anticlockwise',
    utils.debounce(this.volumeDown.bind(this), 500)
  );
  */

  this.pollPowerState();

  this.turnOff();
};

StatusControl.prototype = Object.create(EventEmitter.prototype);

StatusControl.prototype.pollPowerState = function () {
   var self = this;
   request('http://localhost/radio/power', function (error, response, body) {
     if (error || response.statusCode != 200) {
       console.log(error);
       return;
     }

     var state = JSON.parse(body);
     if (state.power.isOn) {
       console.log('POWER: ON');
       self.turnOn(true);
     } else {
       console.log('POWER: OFF');
       self.turnOff(true);
     }
     timers.setTimeout(self.pollPowerState.bind(self), 1000);
   });
}

StatusControl.prototype.handleButton = function () {
  if (this.button.isPressed()) {
    this.toggleState();
  }
};

StatusControl.prototype.turnOn = function (doAction) {
  this.isOn = true;
  this.rgb.colour(green);
  if (!doAction) { request.post('http://localhost/radio/power'); }
};

StatusControl.prototype.turnOff = function (doAction) {
  this.isOn = false;
  this.rgb.colour(red);
  if (!doAction) { request.del('http://localhost/radio/power'); }
};

StatusControl.prototype.toggleState = function () {
  this.isOn ? this.turnOff() : this.turnOn();
};

StatusControl.prototype.volumeUp = function () {
  if (this.isOn) {
    console.log('+5');
    request.post('http://localhost/radio/volume/diff/5');
  }
};

StatusControl.prototype.volumeDown = function () {
  if (this.isOn) {
    console.log('-5');
    request.post('http://localhost/radio/volume/diff/-5');
  }
};

StatusControl.prototype.destroy = function () {
  this.rgb.destroy();
  this.button.destroy();
};

module.exports = StatusControl;
