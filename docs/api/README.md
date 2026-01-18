**tinky**

---

# tinky-keypress

Keypress handling for [Tinky](https://github.com/ByteLandTechnology/tinky), a React-based TUI framework.

This package provides a context provider and hooks to handle keyboard input in your terminal applications. It supports standard keys, modifier combinations (Ctrl, Alt/Meta, Shift), and can handle escape sequences including mouse support (via `tinky-mouse` integration context) and clipboard operations.

## Installation

```bash
npm install tinky-keypress
```

## Usage

Wrap your application (or part of it) with `KeypressProvider` and use the `useKeypress` hook to listen for key events.

```tsx
import React, { useState } from "react";
import { render, Text } from "tinky";
import { KeypressProvider, useKeypress } from "tinky-keypress";

const App = () => {
  const [lastPress, setLastPress] = useState("None");

  useKeypress(
    (key) => {
      setLastPress(`${key.name} (sequence: ${JSON.stringify(key.sequence)})`);

      if (key.name === "q") {
        process.exit(0);
      }
    },
    { isActive: true },
  );

  return (
    <>
      <Text>Press any key (q to exit)</Text>
      <Text>Last Key: {lastPress}</Text>
    </>
  );
};

render(
  <KeypressProvider>
    <App />
  </KeypressProvider>,
);
```

## API

### Components

#### `<KeypressProvider />`

Context provider that manages stdin `data` events, parses escape sequences, and broadcasts key events to subscribers.

**Props:**

- `children`: React nodes.
- `kittyProtocol`: (Optional) Boolean to enable Kitty keyboard protocol parsing support (if enabled in terminal).

### Hooks

#### `useKeypress(handler, options)`

Subscribe to keypress events.

**Parameters:**

- `handler`: Implementation of `KeypressHandler`. Called with a `Key` object.
- `options`: `{ isActive: boolean }`. Pass `isActive: true` to enable the listener.

#### `useKeypressContext()`

Access the underlying context subscriber methods directly (`subscribe`, `unsubscribe`).

### Types

#### `Key`

Object representing a parsed keypress.

```typescript
interface Key {
  name: string; // e.g. "a", "return", "backspace", "up"
  ctrl: boolean; // true if Ctrl key was pressed
  meta: boolean; // true if Alt/Meta key was pressed
  shift: boolean; // true if Shift key was pressed
  insertable: boolean; // true if the key produces a printable character
  sequence: string; // The raw escape sequence or character
}
```

## License

Apache-2.0
