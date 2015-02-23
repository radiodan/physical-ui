# Usage Guide

## What's the Physical-UI server for?

The Physical UI server allows for physical prototyping devices (e.g. buttons,
LEDs, dials) to be added in to the [Radiodan][-2] ecosystem, via the [GPIO][-1]
pins on the [Raspberry Pi][0]. A full set of commands and events are listed in
the [Message Format guide](message-format.md).

Once the server is started, you communicate with it using an application
written with the [Radiodan client library][1].

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

The configuration file is written in [JSON][3]. For each device type, there is a
key, which maps to an array of device objects.

The keys are:

* `buttons`
* `rotaryEncoders`
* `RGBLEDs`

The device objects have the following keys:

### id
A unique identifier used internally to route messages to each element in the
system.

### pins
An array of `pin` ids or objects, defining which pins to be connected to and
how. The ID values are defined by the [Wiring Pi][4] GPIO library.

`Pin` objects have the following keys:

#### pin
The pin number to connect to, as defined by the [Wiring Pi][4] GPIO library.

#### pull
Sets the pull-up or pull-down resistor mode for the given pin. Defaults to
`down`.

#### pressedIsHigh
For `buttons` only, defines which state the pins must be in to trigger a `press`
event. Default is `true`.

### colour
An initial colour for the light to be set to. Expressed as
an array of three RGB colour values from 0-255. For `RGBLEDs` only.

### initialTransition
The transition to be triggered when the server comes online.  See the [Radiodan
Client API][5] for further details of transitions. For `RGBLEDs` only.

### transitions
A default setting for further transitions to be set in the system. See the
[Radiodan Client API][5] for further details of transitions. For `RGBLEDs` only.


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
[-1]: http://www.raspberrypi.org/documentation/usage/gpio
[0]: http://www.raspberrypi.org/help/what-is-a-raspberry-pi
[1]: https://github.com/radiodan/radiodan-client.js
[2]: http://nodejs.org
[3]: http://json.org
[4]: http://wiringpi.com/pins
[5]: http://radiodan-client.readthedocs.org/en/latest/api/rgb-led
