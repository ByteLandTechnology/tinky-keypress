import { describe, it, expect, mock } from "bun:test";
import {
  createDataListener,
  bufferPaste,
  bufferFastReturn,
  bufferBackslashEnter,
  type KeypressHandler,
} from "../src/utils/keypress.js";

describe("createDataListener with raw sequence", () => {
  it("should pass raw sequence for simple characters", () => {
    const handler = mock((() => undefined) as KeypressHandler);
    const listener = createDataListener(handler);

    listener("a");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].name).toBe("a");
    expect(handler.mock.calls[0][1]).toBe("a");
  });

  it("should pass raw sequence for escape sequences", () => {
    const handler = mock((() => undefined) as KeypressHandler);
    const listener = createDataListener(handler);

    // Up arrow
    listener("\x1b[A");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].name).toBe("up");
    expect(handler.mock.calls[0][1]).toBe("\x1b[A");
  });

  it("should handle split escape sequences and accumulate raw", () => {
    const handler = mock((() => undefined) as KeypressHandler);
    const listener = createDataListener(handler);

    listener("\x1b");
    expect(handler).toHaveBeenCalledTimes(0); // buffered

    listener("[");
    expect(handler).toHaveBeenCalledTimes(0); // buffered

    listener("A");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].name).toBe("up");
    expect(handler.mock.calls[0][1]).toBe("\x1b[A");
  });

  it("should pass raw sequence for multiple characters in one chunk", () => {
    const handler = mock((() => undefined) as KeypressHandler);
    const listener = createDataListener(handler);

    listener("abc");
    expect(handler).toHaveBeenCalledTimes(3);

    expect(handler.mock.calls[0][0].name).toBe("a");
    expect(handler.mock.calls[0][1]).toBe("a");

    expect(handler.mock.calls[1][0].name).toBe("b");
    expect(handler.mock.calls[1][1]).toBe("b");

    expect(handler.mock.calls[2][0].name).toBe("c");
    expect(handler.mock.calls[2][1]).toBe("c");
  });
});

describe("Middleware raw sequence propagation", () => {
  it("bufferPaste should pass full raw sequence including brackets", async () => {
    const handler = mock((() => undefined) as KeypressHandler);
    // Wrap with bufferPaste
    const wrapped = bufferPaste(handler);
    const listener = createDataListener(wrapped);

    // Paste start
    listener("\x1b[200~");
    // Content
    listener("hello");
    // Paste end
    listener("\x1b[201~");

    // Helper to wait a small amount of time since paste buffer has timeouts/generators
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should result in one "paste" event
    expect(handler).toHaveBeenCalledTimes(1);
    const [key, raw] = handler.mock.calls[0];

    expect(key.name).toBe("paste");
    expect(key.sequence).toBe("hello");
    // The raw string should include the start and end sequences
    expect(raw).toBe("\x1b[200~hello\x1b[201~");
  });

  it("bufferBackslashEnter should propagate raw", () => {
    const handler = mock((() => undefined) as KeypressHandler);
    const wrapped = bufferBackslashEnter(handler);
    // Manually pump since createDataListener might be complex with generators here
    // But better to use createDataListener to simulate real flow if possible,
    // or just call wrapped directly if we mock Key objects.

    // Let's use createDataListener for integration test style
    const listener = createDataListener(wrapped);

    listener("a");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][1]).toBe("a");
  });

  it("bufferBackslashEnter should propagate raw when backslash is followed by other key", async () => {
    const handler = mock((() => undefined) as KeypressHandler);
    const wrapped = bufferBackslashEnter(handler);
    const listener = createDataListener(wrapped);

    // Send backslash
    listener("\\");
    expect(handler).toHaveBeenCalledTimes(0);

    // Send 'n' immediately
    listener("n");

    // Should flush both
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[0][0].name).toBe(""); // \ has no name, just sequence
    // Wait, backslash usually emits a key with sequence "\\".
    expect(handler.mock.calls[0][1]).toBe("\\");
    expect(handler.mock.calls[1][1]).toBe("n");
  });

  it("bufferFastReturn should propagate raw even when modifying key", () => {
    const handler = mock((() => undefined) as KeypressHandler);
    const wrapped = bufferFastReturn(handler);
    const listener = createDataListener(wrapped); // Assuming we can use createDataListener to feed it

    // Simulate conditions for fast return
    // We need to trigger a key first to set lastKeyTime
    listener("a");
    expect(handler).toHaveBeenCalledTimes(1);

    // Immediately send return
    listener("\r");
    expect(handler).toHaveBeenCalledTimes(2);

    const [key, raw] = handler.mock.calls[1];
    expect(key.name).toBe("return");
    // raw should be the original input
    expect(raw).toBe("\r");
  });
});
