/* globals describe, it, before, beforeEach */
'use strict';

var chai   = require('chai'),
    assert = chai.assert,
    sinon  = require('sinon');

var subject = require('../../lib/components/led'),
    wpiMock = require('../../lib/wiring-pi-mock');

describe('LED', function () {
  before(function () {
    var oldTween;

    this.tween = require('tween.js');
    oldTween = this.tween.Tween;

    this.mockTweenConstructor = function () {
      var mockTween = new this.tween.Tween({ value: 0 }),
          mock = sinon.mock(mockTween);
      this.tween.Tween = function () { return mockTween; }

      return mock;
    };

    this.restoreTweenContructor = function () {
      this.tween.Tween = oldTween;
    }
  });
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
    it('is an alias for brightness(100)', function () {
      var led = subject.create(9, { wpi: this.wpi });
      led.brightness = sinon.spy();

      led.on();
      assert.ok(led.brightness.calledWith(100));
    });
    it('passes through transitions', function () {
      var led = subject.create(9, { wpi: this.wpi }),
          transition = {};
      led.brightness = sinon.spy();

      led.on(transition);
      assert.ok(led.brightness.calledWith(100, transition));
    });
    it('returns promise', function () {
      var led = subject.create(9, { wpi: this.wpi });
      assert.ok( typeof led.on().then === 'function' );
    });
  });

  describe('#off', function () {
    it('is an alias for brightness(0)', function () {
      var led = subject.create(9, { wpi: this.wpi });
      led.brightness = sinon.spy();

      led.off();
      assert.ok(led.brightness.calledWith(0));
    });
    it('passes through transitions', function () {
      var led = subject.create(9, { wpi: this.wpi }),
          transition = {};
      led.brightness = sinon.spy();

      led.off(transition);
      assert.ok(led.brightness.calledWith(0, transition));
    });
    it('returns promise', function () {
      var led = subject.create(9, { wpi: this.wpi });
      assert.ok( typeof led.on().then === 'function' );
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
    it('sends correct signal when reversed', function () {
      var led = subject.create(9, { reverse:true, wpi: this.wpi });
      led.brightness(0);
      assert.ok( this.wpi.digitalWrite.calledWith(9, 1) );
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
    it('returns promise', function () {
      var led = subject.create(9, { wpi: this.wpi });
      assert.ok( typeof led.on().then === 'function' );
    });
    it('overrides default transitions', function () {
      var clock = sinon.useFakeTimers();

      var tween = this.tween,
          led = subject.create(9, { wpi: this.wpi, tween: tween });

      led.brightness(50, { duration: 6000 });

      assert.equal(led.brightness(), 0, 'brightness should be 0');
      tween.update(Date.now() + 3000);
      assert.equal(led.brightness(), 25, 'brightness should be 25');
      tween.update(Date.now() + 6000);
      assert.equal(led.brightness(), 50, 'brightness should be 50');

      clock.restore();
    });
  });

  describe('all transitions', function () {
    it('support repetition', function () {
      var clock = sinon.useFakeTimers();

      var tween = this.tween,
          led = subject.create(9, { wpi: this.wpi, tween: tween });

      led.transitions({ duration: 1000, repeat: true });

      led.brightness(50);
      assert.equal(led.brightness(), 0, 'brightness should be 0');
      tween.update(Date.now() + 1000);
      assert.equal(led.brightness(), 50, 'brightness should be 50');
      tween.update(Date.now() + 1001);
      assert.equal(led.brightness(), 0, 'brightness should be 0 again');
      tween.update(Date.now() + 2000);
      assert.equal(led.brightness(), 50, 'brightness should be 50');

      clock.restore();
    });
    it('support yoyo', function () {
      var clock = sinon.useFakeTimers();

      var tween = this.tween,
          led = subject.create(9, { wpi: this.wpi, tween: tween });

      led.transitions({ duration: 1000, yoyo: true });

      led.brightness(50);
      assert.equal(led.brightness(), 0, 'brightness should be 0');
      tween.update(Date.now() + 1000);
      assert.equal(led.brightness(), 50, 'brightness should be 50');
      tween.update(Date.now() + 1001);
      assert.equal(led.brightness(), 50, 'brightness should remain at 50');
      tween.update(Date.now() + 2000);
      assert.equal(led.brightness(), 0, 'brightness should be 0 again');

      clock.restore();
    });
    it('cancels yoyo on next transition', function () {
      var clock = sinon.useFakeTimers();

      var tween = this.tween,
          led = subject.create(9, { wpi: this.wpi, tween: tween }),
          time = Date.now();

      led.transitions({ duration: 1000 });

      led.brightness(50, { yoyo: true });
      assert.equal(led.brightness(), 0, 'brightness should be 0');
      tween.update(time + 1000);
      assert.equal(led.brightness(), 50, 'brightness should be 50');
      tween.update(time + 1500);
      assert.equal(led.brightness(), 25, 'brightness should reduce to 25');

      led.brightness(100);
      tween.update(time + 2000);
      assert.equal(led.brightness(), 100, 'brightness should be 100');
      tween.update(time + 2500);
      assert.equal(led.brightness(), 100, 'brightness should still be at 100');

      clock.restore();
    });
  });

  describe('#transitions', function () {
    it('allows defaults to be set', function () {
      var led = subject.create(9, { wpi: this.wpi });
      led.transitions({ delay: 5000 });

      assert.deepEqual(led.transitions(), { delay: 5000 });
    });
    it('transitions brightness over a default time period', function () {
      var clock = sinon.useFakeTimers();

      var tween = this.tween,
          led = subject.create(9, { wpi: this.wpi, tween: tween });

      led.transitions({ duration: 2000 });

      led.on();
      assert.equal(led.brightness(), 0, 'brightness should be 0');
      tween.update(Date.now() + 1000);
      assert.equal(led.brightness(), 50, 'brightness should be 50');
      tween.update(Date.now() + 2000);
      assert.equal(led.brightness(), 100, 'brightness should be 100');

      clock.restore();
    });
    it('cancels active transition when new one called', function () {
      var mock  = this.mockTweenConstructor(),
          tween = this.tween,
          led;

      led = subject.create(9, { wpi: this.wpi, tween: tween });

      led.transitions({ duration: 6000 });
      led.on();
      mock.expects("stop").once();
      led.brightness(50);
      mock.verify();

      this.restoreTweenContructor();
    });
  });

  describe('#destroy', function () {
    it('turns LED off', function () {
      var led = subject.create(9, { wpi: this.wpi });
      led.destroy();
      assert.ok( this.wpi.digitalWrite.calledWith(9, 0) );
    });
    it('returns promise', function () {
      var led = subject.create(9, { wpi: this.wpi });
      assert.ok( typeof led.destroy().then === 'function' );
    });
  });
});