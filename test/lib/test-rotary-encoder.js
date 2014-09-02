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

      assert.equal(mockTimer.delay, 1);
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

      instance.readState = function () { return 1; }
      mockTimer.fn();
      mockTimer.fn();
      mockTimer.fn();
      mockTimer.fn();
    });

    it('waits for 4 deltas before emitting', function (done) {
      var mockTimer = function(fn, delay) {
        mockTimer.fn = fn;
        mockTimer.delay = delay;
      };

      var readState = function () { return 1; }

      var readCount = 1;

      var instance = subject.create(1, 2, {
        wpi: this.wpi, timer: mockTimer, algorithm: function () { return readState; }
       });
      instance.on('turn', function (evt) {
        assert.equal(evt.direction, 'clockwise');
        if (readCount === 4) {
          done();
        } else {
          throw Error('emitted too soon');
        }
      });

      readCount++;

      mockTimer.fn();
      readCount++;

      mockTimer.fn();
      readCount++;

      mockTimer.fn();
      readCount++;
    });

    it('averages the deltas when emitting', function (done) {
      var mockTimer = function(fn, delay) {
        mockTimer.fn = fn;
        mockTimer.delay = delay;
      };

      var readStateValue = 1;
      var readState = function () { return 1; }

      var instance = subject.create(1, 2, {
        wpi: this.wpi, timer: mockTimer, algorithm: function () { return readState; }
      });
      instance.on('turn', function (evt) {
        assert.equal(evt.direction, 'clockwise');
        done();
      });

      // these calls will return 1
      mockTimer.fn();
      mockTimer.fn();

      // this call returns -1
      // Should emit with average of 'clockwise'
      readStateValue = -1;
      mockTimer.fn();
    });
  });

  describe('algorithm', function () {
    it('can be swapped out for another', function () {
      var mockTimer = function(fn, delay) {
        mockTimer.fn = fn;
        mockTimer.delay = delay;
      };
      var algoFn = sinon.stub().returns(1);
      var algoConstructor = sinon.stub().returns(algoFn);
      var instance = subject.create(1, 20, { wpi: this.wpi, timer: mockTimer, algorithm: algoConstructor });
      mockTimer.fn();
      assert.ok(algoConstructor.calledWith(1, 20, this.wpi));
      assert.ok(algoFn.called);
    });

    it('throws if function does not supply allowed return values', function () {
      var mockTimer = function(fn, delay) {
        mockTimer.fn = fn;
        mockTimer.delay = delay;
      };
      var algorithmSpy = sinon.stub().returns(undefined);
      var instance = subject.create(1, 20, { wpi: this.wpi, timer: mockTimer });
      instance.readState = algorithmSpy;

      assert.throws(function () {
        mockTimer.fn();
      }, 'readState must return an integer');
    });

    it('allows pull up/down to be configured', function () {
      subject.create(1, 20, { pullA: 'up', pullB: 'down', wpi: this.wpi });
      assert.ok( this.wpi.pullUpDnControl.calledWith(1, this.wpi.PUD_UP) );
      assert.ok( this.wpi.pullUpDnControl.calledWith(20, this.wpi.PUD_DOWN) );
    });
  });

  describe('#destroy', function () {
    it('exists (for API consistency)', function () {
      var instance = subject.create(1, 20, { wpi: this.wpi });
      assert.isFunction(instance.destroy);
    });
  });
});