/* globals describe, it, before, beforeEach */
'use strict';

var chai   = require('chai'),
    assert = chai.assert,
    sinon  = require('sinon');

var subject = require('../../lib/components/utils').easeFunctionNameResolver;

describe('Utils', function () {
  describe('.easeFunctionResolver', function () {
    before(function () {
      this.easing = require('tween.js').Easing;
    });
    it('resolves to a function in target library', function () {
      var easing = this.easing;
      [
        { input: 'easeInOutQuad' , output: easing.Quadratic.InOut },
        { input: 'easeInOutCubic', output: easing.Cubic.InOut },
        { input: 'easeOutQuart'  , output: easing.Quartic.Out },
        { input: 'easeInQuint'   , output: easing.Quintic.In },
        { input: 'easeInExpo'    , output: easing.Exponential.In },
        { input: 'easeOutCirc'   , output: easing.Circular.Out },
        { input: 'easeOutBack'   , output: easing.Back.Out },
        { input: 'easeOutElastic', output: easing.Elastic.Out },
        { input: 'easeOutBounce' , output: easing.Bounce.Out }
      ].forEach(function (params) {
        assert.equal(
          subject(params.input, easing), params.output, params.input
        );
      });
    });
    it('returns null if no fn found', function () {
      assert.equal(subject('easeInBob', this.easing), null, 'easeInBob');
      assert.equal(subject('easeXCubic', this.easing), null, 'easeXCubic');
      assert.equal(subject('something', this.easing), null, 'something');
    });
    it('handles the `linear` special case', function () {
      assert.equal(subject('linear', this.easing), this.easing.Linear.None, 'linear');
    });
    it('handles the `sine` special case', function () {
      assert.equal(subject('easeInOutSine', this.easing), this.easing.Sinusoidal.InOut, 'easeInOutSine');
    });
  });
});