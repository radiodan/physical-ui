var chai   = require('chai'),
    assert = chai.assert,
    sinon  = require('sinon');

var subject = require('../../lib/button'),
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
      var instance = subject.create(9, { wpi: this.wpi });
      assert.ok( this.wpi.setup.called );
      assert.ok( this.wpi.pinMode.calledWith(9, this.wpi.INPUT) );
    });

    it('defaults to high == pressed', function () {
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
  })
});