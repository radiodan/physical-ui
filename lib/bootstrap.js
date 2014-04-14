var components = ['buttons', 'rotaryEncoders', 'RGBLEDs'];

module.exports.start = function(config) {
  config = config || {};

  components.forEach(function(component) {
    var instances = config[component] || [];

    instances.forEach(function(setup) {
      console.log('setup '+component+' with: ', setup);
    });
  });
};
