/* globals describe, it, before, beforeEach */
'use strict';

var chai   = require('chai'),
    assert = chai.assert,
    sinon  = require('sinon');

var subject = require('../../lib/components/button'),
    wpiMock = require('../../lib/wiring-pi-mock');

describe('Button', function () {
  beforeEach(function () {
    // Create a wiring-pi mock where each method is a spy
    this.wpi = wpiMock.create(function () { return sinon.spy(); });
  });

  describe('#create', function () {
    it('returns allows mocking wiring-pi on creation', function () {
      var instance = subject.create(9, { wpi: this.wpi });
      assert.ok(instance);
    });

    it('calls wpi.setup and sets pin mode', function () {
      subject.create(9, { wpi: this.wpi });
      assert.ok( this.wpi.setup.called );
      assert.ok( this.wpi.pinMode.calledWith(9, this.wpi.INPUT) );
    });

    it('defaults to high == press', function () {
      var instance = subject.create(9, { wpi: this.wpi });
      this.wpi.digitalRead = function () { return 1; };
      assert.ok(instance.isPressed());
      assert.notOk(instance.isReleased());
    });

    it('allows high value to be configured', function () {
      var instance = subject.create(9, { wpi: this.wpi, pressedIsHigh: false });
      this.wpi.digitalRead = function () { return 0; };
      assert.ok(instance.isPressed());
      assert.notOk(instance.isReleased());
    });
  });

  describe('events', function () {
    it('emits changed on press or release', function (done) {
      var eventFiredCount = 0;
      var instance = subject.create(9, { wpi: this.wpi });
      instance.on('change', function () {
        eventFiredCount++;
        if (eventFiredCount === 2) { done(); }
      });
      instance.handleEvent();
      instance.handleEvent();
    });

    it('emits press event', function (done) {
      var instance = subject.create(9, { wpi: this.wpi });
      this.wpi.digitalRead = function () { return 1; };
      instance.on('press', function () {
        done();
      });
      instance.on('release', function () {
        throw Error();
      });
      instance.handleEvent();
    });

    it('emits release event', function (done) {
      var instance = subject.create(9, { wpi: this.wpi });
      this.wpi.digitalRead = function () { return 0; };
      instance.on('press', function () {
        throw Error();
      });
      instance.on('release', function () {
        done();
      });
      instance.handleEvent();
    });
  });

});