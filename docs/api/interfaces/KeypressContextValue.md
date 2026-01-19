[**tinky-keypress**](../README.md)

---

[tinky-keypress](../globals.md) / KeypressContextValue

# Interface: KeypressContextValue

Interface defining the shape of the Keypress context value.
Used for subscribing to and unsubscribing from keypress events.

## Properties

### subscribe()

> **subscribe**: (`handler`) => `void`

Registers a handler function to be called when a keypress event occurs.

#### Parameters

##### handler

[`KeypressHandler`](../type-aliases/KeypressHandler.md)

The function to call with the parsed Key object.

#### Returns

`void`

---

### unsubscribe()

> **unsubscribe**: (`handler`) => `void`

Unregisters a previously registered handler function.

#### Parameters

##### handler

[`KeypressHandler`](../type-aliases/KeypressHandler.md)

The handler function to remove.

#### Returns

`void`
