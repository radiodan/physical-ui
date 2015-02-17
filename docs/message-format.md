# Message Formats

## Subscriptions

### event.button.`<id>`.press

Emits when button is pressed.

```json
{
  "pressed": true
}
```

### event.rotary-encoder.`<id>`.turn

Emits when encoder is actively turning.

```json
{
  "direction": "clockwise",
  "distance": 1
}
```

### event.rgb-led.`<id>`.emit

Emits when RGB LED turns on or off. Also returns current colour as RGB value.

```json
{
  "emit": true,
  "colour": [0, 0, 255]
}
```

## Commands

### command.rgb-led.`<id>`

Turn RGB LED on or off:

```json
{
  "emit": true
}
```

Set RGB colour:

```json
{
  "colour": [255, 0, 0]
}
```

