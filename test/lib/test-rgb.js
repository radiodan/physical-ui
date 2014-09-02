/* globals describe, it, before, beforeEach */
'use strict';

var chai   = require('chai'),
    assert = chai.assert,
    sinon  = require('sinon');

var subject = require('../../lib/rgb'),
    wpiMock = require('../../lib/wiring-pi-mock');

function createLEDInstanceSpy() {
  return { on: sinon.spy(), off: sinon.spy(), destroy: sinon.spy() };
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
    it('returns self for chaining', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      assert.equal(rgb.on(), rgb);
    });
  });

  describe('#off', function () {
    it('turns all LEDs off', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      this.led.off.reset(); // ignore init calls
      rgb.off();

      assert.equal(this.led.off.callCount, 3);
    });
    it('returns self for chaining', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      assert.equal(rgb.off(), rgb);
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

      rgb.colour([255, 0, 0]);

      assert.ok(red.on.called);
      assert.notOk(green.on.called);
      assert.notOk(blue.on.called);
    });
    it('returns self for chaining', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      assert.equal(rgb.off(), rgb);
    });
  });

  describe('#destroy', function () {
    it('turns all LEDs off', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      rgb.destroy();

      assert.equal(this.led.destroy.callCount, 3);
    });
    it('does not return self for chaining', function () {
      var rgb = subject.create([9, 10, 11], { LED: this.LED });
      assert.notEqual(rgb.destroy(), rgb);
    });
  });

});