# tinky-keypress

[English](./README.md) | [简体中文](./README.zh-CN.md)

> [Tinky](https://github.com/ByteLandTechnology/tinky) アプリケーションのための堅牢なキープレス処理と入力解析。

このパッケージは、ターミナルユーザーインターフェースにおける標準入力 (stdin) を管理するための専用コンテキストとフックシステムを提供します。特殊キー、修飾キー、モダンなターミナルプロトコルを含む、生の ANSI エスケープシーケンス解析の複雑さを処理します。

## 特徴

- **簡単な統合**: ドロップインで使用できるコンテキストプロバイダー (`KeypressProvider`) とフック (`useKeypress`)。
- **包括的な解析**: 標準キー、ファンクションキー (F1-F12)、ナビゲーションキーなどをサポート。
- **修飾キーのサポート**: Control、Alt/Meta、Shift 修飾キーをサポート。
- **高度なプロトコル**: Kitty キーボードプロトコルのオプションサポート。
- **マウスとクリップボード**: マウスイベントのフィルタリングと OSC 52 ペーストシーケンスのサポートを内蔵。
- **型安全性**: TypeScript で記述されており、完全な型定義を提供します。

## インストール

```bash
npm install tinky-keypress
# または
yarn add tinky-keypress
# または
pnpm add tinky-keypress
# または
bun add tinky-keypress
```

## 使用方法

アプリケーションのルートを `KeypressProvider` でラップし、任意の子コンポーネントで `useKeypress` を使用します。

```tsx
import React, { useState } from "react";
import { render, Text } from "tinky";
import { KeypressProvider, useKeypress } from "tinky-keypress";

function App() {
  const [lastEvent, setLastEvent] = useState<string>("キーを押してください...");

  useKeypress(
    (key) => {
      const parts = [key.name];
      if (key.ctrl) parts.push("Ctrl");
      if (key.meta) parts.push("Alt");
      if (key.shift) parts.push("Shift");

      setLastEvent(
        `検出: ${parts.join("+")} (シーケンス: ${JSON.stringify(key.sequence)})`,
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

`process.stdin` をリッスンするトップレベルのプロバイダー。

| プロパティ      | 型          | デフォルト値 | 説明                                                                                     |
| --------------- | ----------- | ------------ | ---------------------------------------------------------------------------------------- |
| `children`      | `ReactNode` | N/A          | キープレスフックを使用できる子コンポーネント。                                           |
| `kittyProtocol` | `boolean`   | `false`      | Kitty キーボードプロトコルのサポートを有効にします（ターミナルがサポートしている場合）。 |

### `useKeypress(handler, options)`

キープレスイベントを購読するためのフック。

```typescript
useKeypress(
  handler: (key: Key, raw: string) => void,
  options: { isActive: boolean }
): void
```

- **handler**: キープレスが発生したときに呼び出される関数。
- **options.isActive**: リスナーを有効にするかどうか（フォーカス管理に便利です）。

### `Key` インターフェース

ハンドラーに渡されるイベントオブジェクト：

```typescript
interface Key {
  name: string; // キーの名前 (例: 'a', 'enter', 'escape', 'up')
  ctrl: boolean; // Control キーが押されているかどうか
  meta: boolean; // Alt/Meta キーが押されているかどうか
  shift: boolean; // Shift キーが押されているかどうか
  insertable: boolean; // キーが表示可能な文字を生成するかどうか
  sequence: string; // 受信した生の ANSI シーケンス
}
```

## ライセンス

Apache-2.0
