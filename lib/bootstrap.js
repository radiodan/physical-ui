var MessagingClient = require('radiodan-client').MessagingClient,
    logger = require('radiodan-client').utils.logger(__filename),
    failedPromiseHandler = require('radiodan-client').utils.failedPromiseHandler,
    components = ['buttons', 'rotaryEncoders', 'RGBLEDs'],
    Button = require('./button'),
    RotaryEncoder = require('./rotary-encoder'),
    RGB = require('./rgb'),
    exchange = 'radiodan';

module.exports.start = function(config, opts) {
  config = config || {};
  var instances = {};

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

function supplyConfigAndOpts(fn, opts) {
  return function (config) {
    return fn.call(null, config, opts);
  };
}

function createButtons(config, opts) {
  var messagingClient = MessagingClient.create(),
      topicKey = 'event.button.' + config.id,
      pin = config.pins[0],
      button = Button.create( pin, opts ),
      msg = { pressed: true };

  console.log('setup button with: ', config);
  console.log('sending message to ', topicKey, msg);

  button.on('press', function () {
    console.log('button %s pressed', pin);
    messagingClient.sendToExchange(
      exchange, topicKey + '.press', { pressed: true }
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
  opts.algorithm = RotaryEncoder.algorithms.delta;
  opts.updateMethod = 'interrupt';
  
  var messagingClient = MessagingClient.create(),
      topicKey = 'event.rotary-encoder.' + config.id + '.turn',
      encoder = RotaryEncoder.create(config.pins[0], config.pins[1], opts);

  console.log('setup encoder with: ', config);

  encoder.on('turn', function (evt) {
    messagingClient.sendToExchange(
      exchange, topicKey, { direction: evt.direction }
    );
  });

  return [config.id, encoder];
}

function createRGBLEDs(config, opts) {
  var messagingClient = MessagingClient.create(),
      topicKey = 'command.rgb-led.' + config.id,
      msg = { emit: false, colour: [0,0,255] },
      rgb;

  // Reverse the polarity of the neutron flow
  opts.reverse = true;

  rgb = RGB.create(config.pins, opts)

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
  }, failedPromiseHandler(logger));
}

function objectify(array) {
  return array.reduce(function (result, items) {
    if (items && items.length === 2) {
      result[ items[0] ] = items[1];
    }
    return result;
  }, {});
}
