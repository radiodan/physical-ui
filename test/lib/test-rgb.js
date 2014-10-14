/* globals describe, it, before, beforeEach */
'use strict';

var chai   = require('chai'),
    assert = chai.assert,
    sinon  = require('sinon');

var subject = require('../../lib/components/rgb'),
    wpiMock = require('../../lib/wiring-pi-mock');

function createLEDInstanceSpy() {
  return {
    on: sinon.spy(), off: sinon.spy(), brightness: sinon.spy(),
    destroy: sinon.spy(), transitions: sinon.spy()
  };
}

describe('RGB', function () {
  beforeEach(function () {
    this.led = createLEDInstanceSpy();
    this.LED = { create: sinon.stub().returns(this.led) };
  });

  describe('.create', function () {
    it('creates multiple LEDs', function () {
      subject.create([9, 10, 11], { LED: this.LED });
      assert.ok( this.LED.create.calledWith(9) );
      assert.ok( this.LED.create.calledWith(10) );
      assert.ok( this.LED.create.calledWith(11) );
    });
    it('defaults to off', function () {
      subject.create([9, 10, 11], { LED: this.LED });
      assert.equal(this.led.off.callCount, 3);
    });
    it('passes through options to LED', function () {
      subject.create([9, 10, 11], { LED: this.LED, reverse:true });
      var args = this.LED.create.firstCall.args[1];
      assert.deepEqual(args, { reverse:true });
    });
  });

  describe('#on', function () {
    it('turns all LEDs on', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });

      rgb.on();

      assert.ok(this.led.on.calledAfter(this.led.off), 'on called after off');
      assert.equal(this.led.on.callCount, 3, 'led.on() called');
    });
    it('passes through transitions', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      var trans = {};

      rgb.on(trans);

      assert.ok(this.led.on.calledAfter(this.led.off), 'on called after off');
      assert.equal(this.led.on.callCount, 3, 'led.on() called');
      assert.ok(this.led.on.calledWith(trans));
    });
    it('returns promise', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      assert.ok( typeof rgb.on().then === 'function' );
    });
  });

  describe('#off', function () {
    it('turns all LEDs off', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      this.led.off.reset(); // ignore init calls
      rgb.off();

      assert.equal(this.led.off.callCount, 3);
    });
    it('passes through transitions', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      var trans = {};
      this.led.off.reset(); // ignore init calls

      rgb.off(trans);

      assert.equal(this.led.off.callCount, 3);
      assert.ok(this.led.off.calledWith(trans));
    });
    it('returns self for chaining', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      assert.ok( typeof rgb.off().then === 'function' );
    });
  });

  describe('#colour', function () {
    it('turns the correct LEDs on and off', function () {
      var red   = createLEDInstanceSpy(),
          green = createLEDInstanceSpy(),
          blue  = createLEDInstanceSpy();

      this.LED.create.withArgs(9).returns(red);
      this.LED.create.withArgs(10).returns(green);
      this.LED.create.withArgs(11).returns(blue);

      var rgb = subject.create([9, 10, 11], { LED: this.LED });

      rgb.colour([255, 128, 0]);

      assert.ok(red.brightness.calledWith(100));
      assert.ok(green.brightness.calledWith(50));
      assert.ok(blue.brightness.calledWith(0));
    });
    it('returns self for chaining', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      assert.ok( typeof rgb.colour([0,0,0]).then === 'function' );
    });
  });

  describe('#transitions', function () {
    it('proxies to underlying LED object', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      var transitionParams = { delay: 5000 };

      rgb.transitions(transitionParams);

      assert.ok(this.led.transitions.calledWith(transitionParams) );
    });
  });

  describe('#destroy', function () {
    it('turns all LEDs off', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      rgb.destroy();

      assert.equal(this.led.destroy.callCount, 3);
    });
    it('returns promise', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      assert.notEqual(rgb.destroy(), rgb);
    });
  });

});