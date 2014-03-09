var wpi = require('wiring-pi'),
    timers = require('timers'),
    EventEmitter = require('events').EventEmitter;

/*
  Simple Button class
  <pin>           pin number (wiring pi scheme)
  <opts.pull>     'up' enable pull-up resistor
                  'down' enable pull-down resistor
*/
var RotaryEncoder = function (pinA, pinB, opts) {
  opts = opts || {};

  this.pinA = pinA;
  this.pinB = pinB;

  this.position = 0;
  this.lastVal  = 0;

  wpi.setup();

  console.log('setup');

  // switch(opts.pull) {
  //   case 'up'   : wpi.pullUpDnControl(this.pin, wpi.PUD_UP);
  //                 break;
  //   case 'down' : wpi.pullUpDnControl(this.pin, wpi.PUD_DOWN);
  //                 break;
  // }

  wpi.pinMode(this.pinA, wpi.INPUT);
  wpi.pullUpDnControl(this.pinA, wpi.PUD_UP);

  wpi.pinMode(this.pinB, wpi.INPUT);
  wpi.pullUpDnControl(this.pinB, wpi.PUD_UP);

  // console.log('pinA and pinB', this.pinA, this.pinB);

  // wpi.wiringPiISR(this.pinA, wpi.INT_EDGE_BOTH, function () { console.log('a'); });
  // wpi.wiringPiISR(this.pinB, wpi.INT_EDGE_BOTH, function () { console.log('b'); });


  // console.log('interrupts', wpi.INT_EDGE_RISING);

  this.handleEvent();
};

RotaryEncoder.prototype = new EventEmitter();

RotaryEncoder.prototype.handleEvent = function () {
  // console.log('handleEvent');

  var msb = wpi.digitalRead(this.pinA),
      lsb = wpi.digitalRead(this.pinB),
      encoded = (msb << 1) | lsb,
      sum;

  // console.log('msb, lsb, encoded', msb, lsb, encoded);

  sum = (this.lastVal << 2) | encoded;

  if (sum == b('1101') || sum == b('0100') || sum == b('0010') || sum == b('1011')) {
    this.position += 1;
    this.emit('clockwise');
  }

  if (sum == b('1110') || sum == b('0111') || sum == b('0001') || sum == b('1000')) {
    this.position -= 1;
    this.emit('anticlockwise');
  }

  this.lastVal = encoded;

  timers.setTimeout(this.handleEvent.bind(this), 10);
};


RotaryEncoder.prototype.destroy = function () {
  // Doesn't do anything yet
};

function b(str) {
  return parseInt(str, 2);
}

module.exports = RotaryEncoder;
