/* globals describe, it, before, beforeEach */
'use strict';

var chai   = require('chai'),
    assert = chai.assert,
    sinon  = require('sinon');

var subject = require('../../lib/components/led'),
    wpiMock = require('../../lib/wiring-pi-mock');

describe('LED', function () {
  beforeEach(function () {
    // Create a wiring-pi mock where each method is a spy
    this.wpi = wpiMock.create(function () { return sinon.spy(); });
  });

  describe('.create', function () {
    it('calls wpi.setup and sets pin mode', function () {
      subject.create(9, { wpi: this.wpi });
      assert.ok( this.wpi.setup.called );
      assert.ok( this.wpi.pinMode.calledWith(9, this.wpi.OUTPUT) );
    });
  });

  describe('#on', function () {
    it('turns LED on with default brightness', function () {
      var led = subject.create(9, { wpi: this.wpi });
      led.on();
      assert.ok( this.wpi.digitalWrite.calledWith(9, 1) );
      assert.equal( led.brightness(), 100 );
    });
    it('sends correct signal when reversed', function () {
      var led = subject.create(9, { reverse:true, wpi: this.wpi });
      led.on();
      assert.ok( this.wpi.digitalWrite.calledWith(9, 0) );
    });
    it('uses pwm if brightness changed to partial value', function () {
      var led = subject.create(9, { wpi: this.wpi });
      led.brightness(10);
      assert.ok( this.wpi.softPwmWrite.calledWith(9, 10), 'softPwmWrite not called with expected values' );
      led.on();
      assert.ok( this.wpi.softPwmWrite.calledWith(9, 100), 'softPwmWrite not called with expected values' );
      assert.ok( this.wpi.softPwmWrite.calledTwice, 'softPwmWrite not called twice' );
    });
    it('returns self for chaining', function () {
      var led = subject.create(9, { wpi: this.wpi });
      assert.equal( led.on(), led );
    });
  });

  describe('#off', function () {
    it('turns LED off', function () {
      var led = subject.create(9, { wpi: this.wpi });
      led.off();
      assert.ok( this.wpi.digitalWrite.calledWith(9, 0) );
    });
    it('sends correct signal when reversed', function () {
      var led = subject.create(9, { reverse:true, wpi: this.wpi });
      led.off();
      assert.ok( this.wpi.digitalWrite.calledWith(9, 1) );
    });
    it('uses pwm if brightness changed to partial value', function () {
      var led = subject.create(9, { wpi: this.wpi });
      led.brightness(50);
      assert.ok( this.wpi.softPwmWrite.calledWith(9, 50) );
      led.off();
      assert.ok( this.wpi.softPwmWrite.calledWith(9, 0) );
      assert.ok( this.wpi.softPwmWrite.calledTwice );
    });
    it('returns self for chaining', function () {
      var led = subject.create(9, { wpi: this.wpi });
      assert.equal( led.off(), led );
    });
  });

  describe('#brightness', function () {
    it('returns current value if no args', function () {
      var led = subject.create(9, { wpi: this.wpi });
      assert.equal( led.brightness(), 0 );
    });
    it('sets pin for software PWM', function () {
      var pwmInitialValue = 0,
          pwmRange = 100,
          led = subject.create(9, { wpi: this.wpi });

      led.brightness(40);
      assert.ok( this.wpi.softPwmCreate.calledWith(9, pwmInitialValue, pwmRange) );
      assert.ok( this.wpi.softPwmWrite.called );
    });
    it('handles reversed LED', function () {
      var pwmInitialValue = 100,
          pwmRange = 100,
          led = subject.create(9, { wpi: this.wpi, reverse: true });

      led.brightness(40);
      assert.ok( this.wpi.softPwmCreate.calledWith(9, pwmInitialValue, pwmRange) );
    });
    it('calls PWM setup only once', function () {
      var led = subject.create(9, { wpi: this.wpi });

      led.brightness(40);
      led.brightness(60);
      assert.ok( this.wpi.softPwmCreate.calledOnce );
    });
    it('returns self for chaining', function () {
      var led = subject.create(9, { wpi: this.wpi });
      assert.equal( led.brightness(50), led );
    });
  });

  describe('#transitions', function () {
    it('allows defaults to be set', function () {
      var led = subject.create(9, { wpi: this.wpi });
      led.transitions({ delay: 5000 });

      assert.deepEqual(led.transitions(), { delay: 5000 });
    });
    it('transitions brightness over a default time period', function () {
      var tween = require('tween.js'),
          led = subject.create(9, { wpi: this.wpi, tween: tween });
      led.transitions({ duration: 2000 });

      led.on();
      assert.equal(led.brightness(), 0, 'brightness should be 0');
      tween.update(Date.now() + 1000);
      assert.equal(led.brightness(), 50, 'brightness should be 50');
      tween.update(Date.now() + 2000);
      assert.equal(led.brightness(), 100, 'brightness should be 100');

    });
    it('cancels active transition when new one called', function () {
      var tween = require('tween.js'),
          mockTween = new tween.Tween({ value: 0 }),
          mock = sinon.mock(mockTween),
          led;

      tween.Tween = function () { return mockTween; }
      led = subject.create(9, { wpi: this.wpi, tween: tween });

      led.transitions({ duration: 6000 });
      led.on();
      mock.expects("stop").once();
      led.brightness(50);
      mock.verify();
    });
  });

  describe('#destroy', function () {
    it('turns LED off', function () {
      var led = subject.create(9, { wpi: this.wpi });
      led.destroy();
      assert.ok( this.wpi.digitalWrite.calledWith(9, 0) );
    });
    it('does not allow chaining', function () {
      var led = subject.create(9, { wpi: this.wpi });
      assert.notEqual( led.destroy(), led );
    });
    // it('ensures LED cannot be turned back on', function () {
    //   var led = subject.create(9, { wpi: this.wpi });
    //   led.destroy();
    //   led.on();
    //   assert.throws(function (){
    //     led.on();
    //   });
    // });
  });
});