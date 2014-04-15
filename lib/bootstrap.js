var MessagingClient = require('radiodan-client').MessagingClient,
    logger = require('radiodan-client').utils.logger(__filename),
    components = ['buttons', 'rotaryEncoders', 'RGBLEDs'],
    Button = require('./button'),
    exchange = 'radiodan';

module.exports.start = function(config) {
  config = config || {};

  (config.buttons || []).forEach(createButtons);
  (config.rotaryEncoders || []).forEach(createEncoders);
  (config.RGBLEDs || []).forEach(createRGBLEDs);
};

function createButtons(config) {
  var messagingClient = MessagingClient.create(),
      topicKey = 'event.button.' + config.id + '.press',
      pin = config.pins[0],
      button = Button.create( pin ),
      msg = { pressed: true };

  console.log('setup button with: ', config);
  console.log('sending message to ', topicKey, msg);

  button.on('changed', function () {
    console.log('button %s changed', pin);
  });

  button.on('pressed', function () {
    console.log('button %s pressed', pin);
  });

  button.on('released', function () {
    console.log('button %s released', pin);
  });

  messagingClient.sendToExchange(exchange, topicKey, msg);
}

function createEncoders(config) {
  var messagingClient = MessagingClient.create(),
      topicKey = 'event.rotary-encoder.' + config.id + '.turn',
      msg = { direction: 'clockwise', distance: 1 };

  console.log('setup encoder with: ', config);
  console.log('sending message to ', topicKey, msg);

  messagingClient.sendToExchange(exchange, topicKey, msg);
}

function createRGBLEDs(config) {
  var messagingClient = MessagingClient.create(),
      topicKey = 'event.rgb-led.' + config.id + '.emit',
      msg = { emit: false, colour: [0,0,255] };

  console.log('setup led with: ', config);
  console.log('sending message to ', topicKey, msg);

  messagingClient.sendToExchange(exchange, topicKey, msg);
}
