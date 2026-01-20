# tinky-keypress

[English](./README.md) | [日本語](./README.ja-JP.md)

> 为 [Tinky](https://github.com/ByteLandTechnology/tinky) 应用提供强大的按键处理和输入解析功能。

本软件包提供了一套专用的 Context 和 Hooks 系统，用于管理终端用户界面中的标准输入 (stdin)。它处理了解析原始 ANSI 转义序列的复杂性，支持特殊键、修饰键以及现代终端协议。

## 功能特性

- **易于集成**：即插即用的 Context 提供者 (`KeypressProvider`) 和 Hook (`useKeypress`)。
- **全面解析**：支持标准键、功能键 (F1-F12)、导航键等。
- **修饰键支持**：支持 Control、Alt/Meta 和 Shift 修饰键。
- **高级协议**：可选支持 Kitty 键盘协议。
- **鼠标与剪贴板**：内置鼠标事件过滤和 OSC 52 粘贴序列支持。
- **类型安全**：使用 TypeScript 编写，提供完整的类型定义。

## 安装

```bash
npm install tinky-keypress
# 或
yarn add tinky-keypress
# 或
pnpm add tinky-keypress
# 或
bun add tinky-keypress
```

## 使用方法

使用 `KeypressProvider` 包裹应用根组件，并在任何子组件中使用 `useKeypress`。

```tsx
import React, { useState } from "react";
import { render, Text } from "tinky";
import { KeypressProvider, useKeypress } from "tinky-keypress";

function App() {
  const [lastEvent, setLastEvent] = useState<string>("请按任意键...");

  useKeypress(
    (key) => {
      const parts = [key.name];
      if (key.ctrl) parts.push("Ctrl");
      if (key.meta) parts.push("Alt");
      if (key.shift) parts.push("Shift");

      setLastEvent(
        `检测到: ${parts.join("+")} (序列: ${JSON.stringify(key.sequence)})`,
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

监听 `process.stdin` 的顶层 Provider。

| 属性            | 类型        | 默认值  | 描述                                      |
| --------------- | ----------- | ------- | ----------------------------------------- |
| `children`      | `ReactNode` | N/A     | 可以使用按键 Hooks 的子组件。             |
| `kittyProtocol` | `boolean`   | `false` | 启用 Kitty 键盘协议支持（如果终端支持）。 |

### `useKeypress(handler, options)`

订阅按键事件的 Hook。

```typescript
useKeypress(
  handler: (key: Key, raw: string) => void,
  options: { isActive: boolean }
): void
```

- **handler**: 当发生按键时调用的函数。
- **options.isActive**: 是否启用监听器（可用于焦点管理）。

### `Key` 接口

传递给处理程序的事件对象：

```typescript
interface Key {
  name: string; // 按键名称 (例如 'a', 'enter', 'escape', 'up')
  ctrl: boolean; // 是否按下了 Control 键
  meta: boolean; // 是否按下了 Alt/Meta 键
  shift: boolean; // 是否按下了 Shift 键
  insertable: boolean; // 该按键是否产生可打印字符
  sequence: string; // 接收到的原始 ANSI 序列
}
```

## 许可证

Apache-2.0
