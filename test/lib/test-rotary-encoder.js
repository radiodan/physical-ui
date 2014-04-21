/* globals describe, it, before, beforeEach */
'use strict';

var chai   = require('chai'),
    assert = chai.assert,
    sinon  = require('sinon');

var subject = require('../../lib/rotary-encoder'),
    wpiMock = require('../../lib/wiring-pi-mock');

describe('RotaryEncoder', function () {
  beforeEach(function () {
    // Create a wiring-pi mock where each method is a spy
    this.wpi = wpiMock.create(function () { return sinon.spy(); });
  });

  describe('#create', function () {
    it('calls wpi.setup and sets pin mode', function () {
      subject.create(1, 20, { wpi: this.wpi });
      assert.ok( this.wpi.setup.called );
      assert.ok( this.wpi.pinMode.calledWith(1, this.wpi.INPUT) );
      assert.ok( this.wpi.pinMode.calledWith(20, this.wpi.INPUT) );
    });

    it('allows pull up/down to be configured', function () {
      subject.create(1, 20, { pullA: 'up', pullB: 'down', wpi: this.wpi });
      assert.ok( this.wpi.pullUpDnControl.calledWith(1, this.wpi.PUD_UP) );
      assert.ok( this.wpi.pullUpDnControl.calledWith(20, this.wpi.PUD_DOWN) );
    });
  });

  describe('events', function () {
    it('polls pin for updates', function () {
      var mockTimer = function(fn, delay) {
        mockTimer.fn = fn;
        mockTimer.delay = delay;
      };
      var instance = subject.create(9, 10, { wpi: this.wpi, timer: mockTimer });
      mockTimer.fn();

      assert.equal(mockTimer.delay, 5);
      assert.ok(this.wpi.digitalRead.calledWith(9));
      assert.ok(this.wpi.digitalRead.calledWith(10));
    });

    it('emits turn event with direction property', function (done) {
      var mockTimer = function(fn, delay) {
        mockTimer.fn = fn;
        mockTimer.delay = delay;
      };

      var instance = subject.create(1, 2, { wpi: this.wpi, timer: mockTimer });
      instance.on('turn', function (evt) {
        assert.equal(evt.direction, 'clockwise');
        done();
      });

      instance.readState = function () { return 'clockwise'; }
      mockTimer.fn();
    });
  });

  describe('#destroy', function () {
    it('exists (for API consistency)', function () {
      var instance = subject.create(1, 20, { wpi: this.wpi });
      assert.isFunction(instance.destroy);
    });
  });
});