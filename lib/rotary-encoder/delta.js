var mod = require('mod-loop');

function createDeltaAlgorithm(pinA, pinB, wpi) {
  var lastDelta = 0,
      lastRotationSeq = rotationSequence();

  /*
   Returns the quadrature encoder state converted into
   a numerical sequence 0,1,2,3,0,1,2,3...
      
   Turning the encoder clockwise generates these
   values for switches B and A:
    B A
    0 0
    0 1
    1 1
    1 0 
   We convert these to an ordinal sequence number by returning
     seq = (A ^ B) | B << 2
   
  */
  function rotationSequence() {
    var aState = wpi.digitalRead(pinA),
        bState = wpi.digitalRead(pinB),
        rState = (aState ^ bState) | bState << 1;
    
    // console.log('aState, bState, rState', aState, bState, rState);

    return rState;
  }

  /*
    Returns offset values of -2,-1,0,1,2
  */
  function readState() {
    var delta = 0,
        rSeq  = rotationSequence();

    // console.log('rSeq !== lastRotationSeq', rSeq, lastRotationSeq);

    if (rSeq != lastRotationSeq) {
      // mod matches python's divisor-based modulus
      // delta = (rSeq - lastRotationSeq) % 4;
      delta = mod( (rSeq - lastRotationSeq), 4 );

      if (delta === 3) {
        delta = -1;
      } else if (delta === 2) {
        // assume same direction as previous, 2 steps
        //delta = int(math.copysign(delta, self.last_delta))
        console.log('delta 2 (unimplemented)');
      }

      lastDelta = delta;
      lastRotationSeq = rSeq;
    }

    return delta;
  };

  // Public API (mainly for testing)
  readState.rotationSequence = rotationSequence;
  return readState;
}

module.exports = createDeltaAlgorithm;