# tinky-keypress

[简体中文](./README.zh-CN.md) | [日本語](./README.ja-JP.md)

> Robust keypress handling and input parsing for [Tinky](https://github.com/ByteLandTechnology/tinky) applications.

This package provides a dedicated context and hooks system for managing standard input (stdin) in terminal user interfaces. It handles the complexity of parsing raw ANSI escape sequences, including special keys, modifiers, and modern terminal protocols.

## Features

- **Easy Integration**: Drop-in context provider (`KeypressProvider`) and hook (`useKeypress`).
- **Comprehensive Parsing**: Supports standard keys, function keys (F1-F12), navigation keys, and more.
- **Modifier Support**: Handles Control, Alt/Meta, and Shift modifiers.
- **Advanced Protocols**: Optional support for the Kitty Keyboard Protocol.
- **Mouse & Clipboard**: Built-in filtering for mouse events and support for OSC 52 paste sequences.
- **Type-Safe**: Written in TypeScript with complete type definitions.

## Installation

```bash
npm install tinky-keypress
# or
yarn add tinky-keypress
# or
pnpm add tinky-keypress
# or
bun add tinky-keypress
```

## Usage

Wrap your application root with `KeypressProvider` and use `useKeypress` in any child component.

```tsx
import React, { useState } from "react";
import { render, Text } from "tinky";
import { KeypressProvider, useKeypress } from "tinky-keypress";

function App() {
  const [lastEvent, setLastEvent] = useState<string>("Press any key...");

  useKeypress(
    (key) => {
      const parts = [key.name];
      if (key.ctrl) parts.push("Ctrl");
      if (key.meta) parts.push("Alt");
      if (key.shift) parts.push("Shift");

      setLastEvent(
        `Detected: ${parts.join("+")} (Sequence: ${JSON.stringify(key.sequence)})`,
      );

      if (key.name === "q" && !key.ctrl) {
        process.exit(0);
      }
    },
    { isActive: true },
  );

  return <Text>{lastEvent}</Text>;
}

const instance = render(
  <KeypressProvider>
    <App />
  </KeypressProvider>,
);
```

## API

### `<KeypressProvider />`

The top-level provider that listens to `process.stdin`.

| Prop            | Type        | Default | Description                                                                    |
| --------------- | ----------- | ------- | ------------------------------------------------------------------------------ |
| `children`      | `ReactNode` | N/A     | Child components that can use keypress hooks.                                  |
| `kittyProtocol` | `boolean`   | `false` | Enable support for the Kitty keyboard protocol (if supported by the terminal). |

### `useKeypress(handler, options)`

Hook to subscribe to keypress events.

```typescript
useKeypress(
  handler: (key: Key, raw: string) => void,
  options: { isActive: boolean }
): void
```

- **handler**: Function called whenever a keypress occurs.
- **options.isActive**: Boolean to enable or disable the listener (useful for focus management).

### `Key` Interface

The event object passed to the handler:

```typescript
interface Key {
  name: string; // The name of the key (e.g., 'a', 'enter', 'escape', 'up')
  ctrl: boolean; // Whether the Control key is pressed
  meta: boolean; // Whether the Alt/Meta key is pressed
  shift: boolean; // Whether the Shift key is pressed
  insertable: boolean; // Whether the key produces a printable character
  sequence: string; // The raw ANSI sequence received
}
```

## License

Apache-2.0
