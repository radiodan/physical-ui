var MessagingClient = require('radiodan-client').MessagingClient,
    logger          = require('radiodan-client').utils.logger(__filename),
    failedPromise   = require('radiodan-client').utils.failedPromiseHandler,
    promise         = require('radiodan-client').utils.promise,
    clone           = require('./components/utils').clone,
    instances       = {};

module.exports.start = function(config, opts) {
  var msgClient = MessagingClient.create(),
      publisher = msgClient.Publisher.create();

  config = config || {};
  opts   = opts   || {};

  if (!opts.components) {
    opts.components = {
      buttons        : require('./components/button'),
      rotaryEncoders : require('./components/rotary-encoder'),
      RGBLEDs        : require('./components/rgb')
    };
  }

  instances.buttons = (config.buttons || []).map( supplyConfigAndOpts(createButtons, opts, publisher) );
  instances.rotaryEncoders = (config.rotaryEncoders || []).map( supplyConfigAndOpts(createEncoders, opts, publisher) );
  instances.rgbs = (config.RGBLEDs || []).map( supplyConfigAndOpts(createRGBLEDs, opts, msgClient) );

  instances.buttons = objectify(instances.buttons);
  instances.rotaryEncoders = objectify(instances.rotaryEncoders);
  instances.rgbs = objectify(instances.rgbs);

  if (opts.repl) {
    require('./repl-socket').attach(opts.repl, instances);
  }

  return { instances: instances };
};

module.exports.stop = function() {
  var promises = [].concat(
    destroyInstances( instances.buttons ),
    destroyInstances( instances.rotaryEncoders ),
    destroyInstances( instances.rgbs )
  );

  return promise.all(promises);
};

function destroyInstances(obj) {
  return Object.keys(obj)
          .map(function (key) {
            return destroy( obj[key] );
          });
}

function destroy(component) {
  if (typeof component.destroy === 'function') {
    return component.destroy();
  }
}

function supplyConfigAndOpts(fn, opts, msg) {
  return function (config) {
    return fn.call(null, config, opts, msg);
  };
}

function createButtons(config, opts, publisher) {
  var Button = opts.components.buttons,
      topicKey = 'event.button.' + config.id,
      pinConfig = config.pins[0],
      pin = (typeof pinConfig === 'number') ? pinConfig : pinConfig.pin,
      buttonOpts = clone(opts),
      button,
      msg = { pressed: true };

  if (pinConfig.pull) { buttonOpts.pull = pinConfig.pull; }

  if (pinConfig.pressedIsHigh != null) {
    buttonOpts.pressedIsHigh = pinConfig.pressedIsHigh;
  }

  console.log('buttonOpts: ', buttonOpts);
  console.log('setup button with: ', config);

  button = Button.create( pin, buttonOpts );

  button.on('press', function () {
    console.log('button %s pressed', pin);
    publisher.publish(topicKey + '.press', { pressed: true })
  });

  button.on('hold', function (evt) {
    console.log('button %s hold', pin);
    publiser.publish(
      topicKey + '.hold', { pressed: true, durationMs: evt.durationMs }
    );
  });

  button.on('release', function () {
    console.log('button %s released', pin);
    publisher.publish(
      topicKey + '.release', { pressed: false }
    );
  });

  return [config.id, button];
}

function createEncoders(config, opts, publisher) {
  var RotaryEncoder = opts.components.rotaryEncoders,
      topicKey = 'event.rotary-encoder.' + config.id + '.turn',
      pinAConfig = config.pins[0],
      pinA = (typeof pinAConfig === 'number') ? pinAConfig : pinAConfig.pin,
      pinBConfig = config.pins[1],
      pinB = (typeof pinBConfig === 'number') ? pinBConfig : pinBConfig.pin,
      encoderOpts = clone(opts),
      encoder;

  if (pinAConfig.pull) {
    encoderOpts.pullA = pinAConfig.pull;
  }

  if (pinBConfig.pull) {
    encoderOpts.pullB = pinBConfig.pull;
  }

  encoderOpts.algorithm = RotaryEncoder.algorithms.delta;
  encoderOpts.updateMethod = 'interrupt';

  encoder = RotaryEncoder.create(pinA, pinB, encoderOpts);

  console.log('setup encoder with: ', config);

  encoder.on('turn', function (evt) {
    var msg = { direction: evt.direction };
    console.log('sending message to ', topicKey, msg);
    publisher.publish(topicKey, msg);
  });

  return [config.id, encoder];
}

function createRGBLEDs(config, opts, msgClient) {
  var RGB = opts.components.RGBLEDs,
      topicKey = 'command.rgb-led.' + config.id,
      workerId = 'radiodan-physical-ui-rgbled-' + config.id,
      msg = { emit: false, colour: [0,0,255] },
      rgbOpts = clone(opts),
      worker = msgClient.Worker.create(workerId),
      rgb;

  // Reverse the polarity of the neutron flow
  rgbOpts.reverse = true;

  rgb = RGB.create(config.pins, rgbOpts);

  if (config.transitions) {
    rgb.transitions(config.transitions);
  }

  console.log('setup led with: ', config);
  console.log('sending message to ', topicKey, msg);

  if (config.colour) {
    rgb.colour(config.colour, config.initialTransition);
  }

  worker.addService({ serviceType: 'rgb-led', serviceInstances: [config.id] });
  worker.ready();

  worker.events.on('request', function (req) {
    var stateChangePromise;

    switch(req.command) {
      case 'change':
        req.params.queue = req.params.queue || [];

        stateChangePromise = promise.all(
          req.params.queue.map(function (params, index) {
            params.chain = index > 0;
            return changeRgbState(rgb, params);
          })
        );
        break;
      case 'status':
        stateChangePromise = rgb.colour()
                               .then(function (col) {
                                 return { colour: col };
                               });
        break;
      default:
        stateChangePromise = changeRgbState(rgb, req.params);
    }

    stateChangePromise.then(
      function() {
        worker.respond(req.sender, req.correlationId, {error: false});
      },
      function() {
        worker.respond(req.sender, req.correlationId, {error: true});
      }
    );
  });

  return [config.id, rgb];
}

function changeRgbState(rgb, params) {
  var colour     = params.colour,
      transition = params.transition;

  if (params.chain && transition) {
    transition.chain = params.chain;
  }

  logger.info('Command - color %s, chain %s, transition', colour, params.chain, transition);

  if (colour) {
    return rgb.colour(colour, transition);
  } else {
    return promise.resolve();
  }
}

function objectify(array) {
  return array.reduce(function (result, items) {
    if (items && items.length === 2) {
      result[ items[0] ] = items[1];
    }
    return result;
  }, {});
}
