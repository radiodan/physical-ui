#physical-ui

Physical interface for Radiodan, using the GPIO pins of the Raspberry Pi. This probably won't compile on any other platform.

Currently a counterpart of the
[Magic Button](https://github.com/radiodan/magic-button) web app.

[![Build Status](https://travis-ci.org/radiodan/physical-ui.svg?branch=master)](https://travis-ci.org/radiodan/physical-ui)


Installing
---

    npm install

Running
---

    bin/server path/to/config.json

On non-Pi systems, specify a mock wiring-pi library should be used. Calls to this mock won't fail, but they won't do anything either.

    WIRING_PI=mock bin/server path/to/config.json

Development
---

JSON config file is used to specify pins and initial state for buttons, LEDs and rotary encoders. `lib/bootstrap.js` is where all of this is setup.

REPL (Experimental)
---

A read-eval-print-loop (REPL) is available to control the server from a utility program `bin/repl`. They communicate via a socket which is specified on startup:

    REPL=/tmp/repl.sock bin/server path/to/config.json

Connect to the server process by specifing the same socket path:

    bin/repl /tmp/repl.sock

You should now have a repl for manipulating the physical UI objects.