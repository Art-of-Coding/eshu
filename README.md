# Eshu

Eshu is a God of travelers, roads, crossroads, fortune and misfortune.
He is also a spirit of trickery and chaos who leads mortals to temptation
and possible tribulation in the hopes that the experience will lead ultimately
to their maturation.

But in this case, it's just a TypeScript **MQTT library for node.js** with some
**extra flavor**. It can of course also be used in vanilla JS.

## Install

```bash
npm i @art-of-coding/eshu --save
```

## Example

### Super Simple Example

No flashy things, just the basics:

```ts
import * as eshu from '@art-of-coding/eshu'

// Create a new client
const client = new eshu.Client()

// Set a message event handler
client.on('message', (packet: eshu.IPacket) => {
  console.log(`${packet.topic} says ${packet.payload.toString()}`)
})

// Connect to the broker
client.connect('mqtt://example.com').then((connack: eshu.IConnackPacket) => {
  // Subscribe to a topic
  return client.subscribe('some/topic')
}).then(() => {
  // Publish on the same topic
  return client.publish('some/topic', 'Hello, world!')
}).catch((err: Error) => {
  console.error(err)
})
```

Output:

```
some/topic says Hello, world!
```

### Router Example

To use the full force of Eshu, one would normally use a `Router`.
The example below demonstrates the `prefix` option and the use of named topic
wildcards.

```ts
import * as eshu from '@art-of-coding/eshu'

// Create a new client
const client = new eshu.Client()

// Create a new router
const router = new eshu.Router(client, {
  prefix: 'router'
})

// Connect to the broker
client.connect('mqtt://example.com').then((connack: eshu.IConnackPacket) => {

  // Subscribe to a topic with a named wildcard (`+topic`)
  return router.subscribe('another/+topic', (packet: eshu.IPacket) => {
    // You can access the named wildcard as packet.params.topic
    console.log(`${packet.topic} says ${packet.payload.toString()}`)
  })
}).then(() => {
  return client.publish('another/diamond', 'Hello, world!')
}).catch((err: Error) => {
  console.error(err)
})
```

Output:

```
router/another/diamond says Hello, world!
```

## Parameter wildcards

When using a `Router`, you can use parameter wildcards in `subscribe`.
This is an almost verbatim copy of [mqtt-pattern](https://github.com/RangerMauve/mqtt-pattern),
adjusted for TypeScript (as no declaration file is included yet).

### Single named parameter wildcards

A single named parameter wildcard uses MQTT's wildcard symbol (`+`) and a name.
When a message matching the topic is received, the named parameter is parsed and
made available through `packet.params`:

```ts
// Subscribe using two named wildcards
router.subscribe('say/+what/to/+name', packet => {
  console.log(`${packet.params.what}, ${packet.params.name}!`)
})

// Publish an empty object ({}) payload
router.publish('say/hello/to/Mike', {})
```

Output:

```
hello, Mike!
```

## Catch-all named parameter wildcards

The catch-all wildcard (`#`) is supported as well. It can only be used at the end
of a topic:

```ts
// Subscribe using a catch-all wildcard
router.subscribe('say/+what/to/#names', packet => {
  console.log(`${packet.params.what}, ${packet.params.names.join(', ')}!`)
})

// Publish an empty object ({}) payload
router.publish('say/hello/to/Mike/Dennis/Franky', {})
```

Output:

```
hello, Mike, Dennis, Franky!
```

For more information on using named wildcards, see [mqtt-pattern](https://github.com/RangerMauve/mqtt-pattern).

## API

> Under construction

## License

Copyright 2017 [Michiel van der Velde](http://www.michielvdvelde.nl).

This software is licensed under the [MIT License](LICENSE).
