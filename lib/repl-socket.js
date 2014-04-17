var repl = require('repl'),
    net  = require('net'),
    fs   = require('fs');

module.exports.attach = function (path, context) {
  var server = net.createServer(function (socket) {
    var r = repl.start({
        prompt: 'socket ' + path + '> '
      , input: socket
      , output: socket
      , terminal: true
      , useGlobal: false
    });
    r.on('exit', function () {
      socket.end();
    });
    r.context.socket = socket;
    Object.keys(context)
          .forEach(function (key) { r.context[key] = context[key]; });
  }).listen(path);

  server.on('error', function (e) {
    if (e.code == 'EADDRINUSE') {
      var clientSocket = new net.Socket();
      clientSocket.on('error', function(e) { // handle error trying to talk to server
        if (e.code == 'ECONNREFUSED') {  // No other server listening
          fs.unlinkSync(path);
          server.listen(path, function() { //'listening' listener
            console.log('server recovered');
          });
        }
      });
      clientSocket.connect({path: path}, function() { 
        console.log('Another server running, giving up...');
        process.exit();
      });
    }
  });
}