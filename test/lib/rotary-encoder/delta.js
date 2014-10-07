/* globals describe, it, before, beforeEach */
'use strict';

var chai   = require('chai'),
    assert = chai.assert,
    sinon  = require('sinon');

var subject = require('../../../lib/components/rotary-encoder/delta'),
    wpiMock = require('../../../lib/wiring-pi-mock');

describe('RotaryEncoder.algorithms.delta', function () {
  beforeEach(function () {
    // Create a wiring-pi mock where each method is a spy
    this.wpi = wpiMock.create(function () { return sinon.spy(); });
  });


  /*
    A B STATE SEQ* DELTA
    1 1   3    2    1
    0 1   2    3    1
    0 0   0    0    1
    1 0   1    1    1
    1 1   3    2    1
    0 1   2    3    1
  */
  describe('rotationSequence', function () {
    it('returns the right sequence value', function () {
      this.wpi.digitalRead = sinon.stub();

      this.wpi.digitalRead.withArgs(1).returns(1);
      this.wpi.digitalRead.withArgs(2).returns(1);

      var instance = subject(1, 2, this.wpi);

      assert.equal(instance.rotationSequence(), 2);

      this.wpi.digitalRead.withArgs(1).returns(0);
      this.wpi.digitalRead.withArgs(2).returns(1);
      assert.equal(instance.rotationSequence(), 3);

      this.wpi.digitalRead.withArgs(1).returns(0);
      this.wpi.digitalRead.withArgs(2).returns(0);
      assert.equal(instance.rotationSequence(), 0);

      this.wpi.digitalRead.withArgs(1).returns(1);
      this.wpi.digitalRead.withArgs(2).returns(0);
      assert.equal(instance.rotationSequence(), 1);
    });
  });

  describe('delta', function () {
    it('returns the right delta value', function () {
      this.wpi.digitalRead = sinon.stub();

      this.wpi.digitalRead.withArgs(1).returns(1);
      this.wpi.digitalRead.withArgs(2).returns(1);

      var instance = subject(1, 2, this.wpi);
      assert.equal(instance(), 0);
      assert.equal(instance(), 0);

      this.wpi.digitalRead.withArgs(1).returns(0);
      this.wpi.digitalRead.withArgs(2).returns(1);
      assert.equal(instance(), 1);

      this.wpi.digitalRead.withArgs(1).returns(0);
      this.wpi.digitalRead.withArgs(2).returns(0);
      assert.equal(instance(), 1);
      this.wpi.digitalRead.withArgs(1).returns(1);
      this.wpi.digitalRead.withArgs(2).returns(0);
      assert.equal(instance(), 1);
    });
  });
});