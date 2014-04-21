function createDefaultReadState(pinA, pinB, wpi) {
  var lastVal  = 0,
      position = 0;

  return function readState() {
    var msb = wpi.digitalRead(pinA),
        lsb = wpi.digitalRead(pinB),
        encoded = (msb << 1) | lsb,
        direction = null,
        sum;

    sum = (lastVal << 2) | encoded;

    if (sum == b('1101') || sum == b('0100') || sum == b('0010') || sum == b('1011')) {
      position += 1;
      direction = 'clockwise';
    }

    if (sum == b('1110') || sum == b('0111') || sum == b('0001') || sum == b('1000')) {
      position -= 1;
      direction = 'anticlockwise';
    }

    lastVal = encoded;

    return direction;
  };
}

// str -> binary
function b(str) {
  return parseInt(str, 2);
}


module.exports = createDefaultReadState;