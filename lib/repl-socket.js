var repl = require('repl'),
    net  = require('net'),
    fs   = require('fs');

module.exports.attach = function (path, context) {
  net.createServer(function (socket) {
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

  process.on('SIGINT', function() {
    clearSocket(path);
    process.exit();
  });
}

function clearSocket(path) {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
}