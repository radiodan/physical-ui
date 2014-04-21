function createDeltaAlgorithm(pinA, pinB, wpi) {
  var lastDelta = 0,
      lastRotationSeq = rotationSequence();

  function rotationSequence() {
    var aState = wpi.digitalRead(pinA),
        bState = wpi.digitalRead(pinB),
        rState = (aState ^ bState) | bState << 1;
    
    // console.log('aState, bState, rState', aState, bState, rState);

    return rState;
  }

  return function readState() {
    var delta = 0,
        rSeq  = rotationSequence();

    // console.log('rSeq !== lastRotationSeq', rSeq, lastRotationSeq);

    if (rSeq !== lastRotationSeq) {
      delta = (rSeq - lastRotationSeq) % 4;
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

    if (delta != 0){ console.log('delta', delta); }

    return delta;
  };
}

module.exports = createDeltaAlgorithm;