var MessagingClient = require('radiodan-client').MessagingClient,
    logger = require('radiodan-client').utils.logger(__filename),
    components = ['buttons', 'rotaryEncoders', 'RGBLEDs'],
    Button = require('./button'),
    RGB = require('./rgb'),
    exchange = 'radiodan';

module.exports.start = function(config, opts) {
  config = config || {};
  var instances = {};

  instances.buttons = (config.buttons || []).map( supplyConfigAndOpts(createButtons, opts) );
  instances.rotaryEncoders = (config.rotaryEncoders || []).map( supplyConfigAndOpts(createEncoders, opts) );
  instances.rgbs = (config.RGBLEDs || []).map( supplyConfigAndOpts(createRGBLEDs, opts) );

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

  return button;
}

function createEncoders(config, opts) {
  var messagingClient = MessagingClient.create(),
      topicKey = 'event.rotary-encoder.' + config.id + '.turn',
      msg = { direction: 'clockwise', distance: 1 };

  console.log('setup encoder with: ', config);
  console.log('sending message to ', topicKey, msg);

  messagingClient.sendToExchange(exchange, topicKey, msg);

  return null;
}

function createRGBLEDs(config, opts) {
  var messagingClient = MessagingClient.create(),
      topicKey = 'event.rgb-led.' + config.id + '.emit',
      rgb = RGB.create(config.pins, opts),
      msg = { emit: false, colour: [0,0,255] };

  console.log('setup led with: ', config);
  console.log('sending message to ', topicKey, msg);
  
  if (config.colour) {
    rgb.colour(config.colour);
  }

  messagingClient.sendToExchange(exchange, topicKey, msg);

  return rgb;
}
