# Usage Guide

## What's the Physical-UI server for?

The Physical UI server allows for physical prototyping devices (e.g. buttons,
LEDs, dials) to be added in to the [Radiodan][-2] ecosystem, via the [GPIO][-1]
pins on the [Raspberry Pi][0]. A full set of commands and events are listed in
the [Message Format guide](message-format.md).

Once the server is started, you communicate with it using an application
written with the [radiodan client library][1].

## Installation

The server is written in [Node.js][2]. We're currently testing against the
following branches:

* 0.11
* 0.10

Node.js dependencies can be resolved using `npm install`.

## Currently Supported Prototyping Devices

* Rotary Encoder
* RGB LED
* Button

## Configuration File

A configuration file is required in order to start the server. This file defines
the attached devices, their names and to which pins on the GPIO they are
attached to.

The configuration file is written in [JSON][3], and the following keys are
accepted:

### Example File
```json
{
  "buttons": [
    {
      "id": "next",
      "pins": [
        {
          "pin": 2,
          "pull": "up",
          "pressedIsHigh": false
        }
      ]
    },
  ],
  "rotaryEncoders": [
    {
      "id": "volume",
      "pins": [
        {
          "pin": 5,
          "pull": "up"
        },
        {
          "pin": 4,
          "pull": "up"
        }
      ]
    }
  ],
  "RGBLEDs": [
    {
      "id": "power",
      "pins": [6,10,11],
      "colour": [200, 200, 200],
      "transitions": {
        "duration": 750
      },
      "initialTransition": {
        "duration": 5000,
        "yoyo": true
      }
    }
  ]
}
```

## Environment Variables

### LOG_LEVEL
Defines the verbosity of logging in the system. Supported levels: `debug, info,
warn, error, silent`.

Logger writes to `STDOUT`.

## Command to start server

`./bin/server <path to config json>`

[-2]: http://radiodan.net
[-1]: http://www.raspberrypi.org/documentation/usage/gpio/
[0]: http://www.raspberrypi.org/help/what-is-a-raspberry-pi/
[1]: https://github.com/radiodan/radiodan-client.js
[2]: http://nodejs.org
[3]: http://json.org
