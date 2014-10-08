var MessagingClient = require('radiodan-client').MessagingClient,
    logger          = require('radiodan-client').utils.logger(__filename),
    failedPromise   = require('radiodan-client').utils.failedPromiseHandler,
    instances       = {},
    exchange        = 'radiodan';

module.exports.start = function(config, opts) {
  config = config || {};

  instances.buttons = (config.buttons || []).map( supplyConfigAndOpts(createButtons, opts) );
  instances.rotaryEncoders = (config.rotaryEncoders || []).map( supplyConfigAndOpts(createEncoders, opts) );
  instances.rgbs = (config.RGBLEDs || []).map( supplyConfigAndOpts(createRGBLEDs, opts) );

  instances.buttons = objectify(instances.buttons);
  instances.rotaryEncoders = objectify(instances.rotaryEncoders);
  instances.rgbs = objectify(instances.rgbs);

  if (opts.repl) {
    require('./repl-socket').attach(opts.repl, instances);
  }
};

module.exports.stop = function() {
  destroyInstances(instances.buttons);
  destroyInstances(instances.rotaryEncoders);
  destroyInstances(instances.rgbs);
};

function destroyInstances(obj) {
  for( var key in obj ) {
    destroy( obj[key] );
  }
}

function destroy(component) {
  if (typeof component.destroy === 'function') {
    component.destroy();
  }
}

function supplyConfigAndOpts(fn, opts) {
  return function (config) {
    return fn.call(null, config, opts);
  };
}

function createButtons(config, opts) {
  var Button = opts.components.buttons,
      messagingClient = MessagingClient.create(),
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
  console.log('sending message to ', topicKey, msg);

  button = Button.create( pin, buttonOpts );

  button.on('press', function () {
    console.log('button %s pressed', pin);
    messagingClient.sendToExchange(
      exchange, topicKey + '.press', { pressed: true }
    );
  });

  button.on('hold', function (evt) {
    console.log('button %s released', pin);
    messagingClient.sendToExchange(
      exchange, topicKey + '.hold', { pressed: true, duration: evt.durationMs }
    );
  });

  button.on('release', function () {
    console.log('button %s released', pin);
    messagingClient.sendToExchange(
      exchange, topicKey + '.release', { pressed: false }
    );
  });

  messagingClient.sendToExchange(exchange, topicKey, msg);

  return [config.id, button];
}

function createEncoders(config, opts) {  
  var RotaryEncoder = opts.components.rotaryEncoders,
      messagingClient = MessagingClient.create(),
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
    messagingClient.sendToExchange(exchange, topicKey, msg);
  });

  return [config.id, encoder];
}

function createRGBLEDs(config, opts) {
  var RGB = opts.components.RGBLEDs,
      messagingClient = MessagingClient.create(),
      topicKey = 'command.rgb-led.' + config.id,
      msg = { emit: false, colour: [0,0,255] },
      rgbOpts = clone(opts),
      rgb;

  // Reverse the polarity of the neutron flow
  rgbOpts.reverse = true;

  rgb = RGB.create(config.pins, rgbOpts);

  // Turn LEDs on
  rgb.on();

  console.log('setup led with: ', config);
  console.log('sending message to ', topicKey, msg);

  if (config.colour) {
    rgb.colour(config.colour);
  }

  listenForCommands(messagingClient, topicKey, config.id, function (msg) {
    var colour = msg.content.colour;
    if (colour) {
      rgb.colour(colour);
    }
  }); 

  // messagingClient.sendToExchange(exchange, topicKey, msg);

  return [config.id, rgb];
}

function listenForCommands(messagingClient, topicKey, id, handler) {
  return messagingClient.createAndBindToExchange({
    exchangeName: 'radiodan',
    topicsKey: topicKey
  }).then(function() {
    logger.info('Registered: ', id, 'on: ', topicKey);

    // messagingClient.on(topicKey, respondToCommand);
    messagingClient.on(topicKey, handler);
  }, failedPromise(logger));
}

function objectify(array) {
  return array.reduce(function (result, items) {
    if (items && items.length === 2) {
      result[ items[0] ] = items[1];
    }
    return result;
  }, {});
}

function clone(source, sanitise) {
  if (sanitise) {
    return JSON.parse( JSON.stringify(source) );
  } else {
    return Object.keys(source)
                 .reduce(function (target, key) {
                   target[key] = source[key];
                   return target;
                 }, {});
  }
}
