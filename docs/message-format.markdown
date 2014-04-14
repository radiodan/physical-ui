# Message Formats

## Subscriptions

### button.`<id>`

Emits when button is pressed.

    {
      pressed: true
    }

### encoder.`<id>`

Emits when encoder is actively turning.

    {
      direction: 'clockwise',
      distance: 1
    }

### rgb.`<id>`

Emits when RGB LED turns on or off. Also returns current colour as RGB value.

    {
      emit: true,
      colour: [0, 0, 255]
    }

## Commands

### command.rgb.`<id>`

Turn RGB LED on or off:

    {
      emit: true
    }

Set RGB colour:

    {
      colour: [255, 0, 0]
    }

