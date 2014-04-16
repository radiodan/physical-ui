var MessagingClient = require('radiodan-client').MessagingClient,
    logger = require('radiodan-client').utils.logger(__filename),
    components = ['buttons', 'rotaryEncoders', 'RGBLEDs'],
    Button = require('./button'),
    exchange = 'radiodan';

module.exports.start = function(config, opts) {
  config = config || {};

  (config.buttons || []).forEach( supplyConfigAndOpts(createButtons, opts) );
  (config.rotaryEncoders || []).forEach( supplyConfigAndOpts(createEncoders, opts) );
  (config.RGBLEDs || []).forEach( supplyConfigAndOpts(createRGBLEDs, opts) );
};

function supplyConfigAndOpts(fn, opts) {
  return function (config) {
    fn.call(null, config, opts);
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
}

function createEncoders(config, opts) {
  var messagingClient = MessagingClient.create(),
      topicKey = 'event.rotary-encoder.' + config.id + '.turn',
      msg = { direction: 'clockwise', distance: 1 };

  console.log('setup encoder with: ', config);
  console.log('sending message to ', topicKey, msg);

  messagingClient.sendToExchange(exchange, topicKey, msg);
}

function createRGBLEDs(config, opts) {
  var messagingClient = MessagingClient.create(),
      topicKey = 'event.rgb-led.' + config.id + '.emit',
      msg = { emit: false, colour: [0,0,255] };

  console.log('setup led with: ', config);
  console.log('sending message to ', topicKey, msg);

  messagingClient.sendToExchange(exchange, topicKey, msg);
}
