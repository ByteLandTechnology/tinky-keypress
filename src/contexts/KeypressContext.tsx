import { createContext, useCallback, useEffect, useRef } from "react";
import { useApp, useStdin, useStdout } from "tinky";
import {
  type Key,
  type KeypressHandler,
  bufferBackslashEnter,
  bufferFastReturn,
  bufferPaste,
  createDataListener,
  nonKeyboardEventFilter,
} from "../utils/keypress.js";

export type { Key, KeypressHandler };

/**
 * Interface defining the shape of the Keypress context value.
 * Used for subscribing to and unsubscribing from keypress events.
 */
export interface KeypressContextValue {
  /**
   * Registers a handler function to be called when a keypress event occurs.
   * @param handler - The function to call with the parsed Key object.
   */
  subscribe: (handler: KeypressHandler) => void;
  /**
   * Unregisters a previously registered handler function.
   * @param handler - The handler function to remove.
   */
  unsubscribe: (handler: KeypressHandler) => void;
}

/**
 * React Context for handling keypress events.
 * Provides mechanisms to subscribe to global key input events processed from stdin.
 */
export const KeypressContext = createContext<KeypressContextValue | undefined>(
  undefined,
);

/**
 * Provider component for the Keypress context.
 * Manages stdin data listening and parsing, and broadcasts key events to subscribers.
 */
export function KeypressProvider({
  children,
  kittyProtocol = false,
}: {
  /** Child components */
  children: React.ReactNode;
  /** Whether Kitty keyboard protocol is enabled (from useTermcap) */
  kittyProtocol?: boolean;
}) {
  const { stdin, setRawMode, isRawModeSupported } = useStdin();
  const { stdout } = useStdout();
  const { platform } = useApp();

  const subscribers = useRef<Set<KeypressHandler>>(new Set()).current;
  const subscribe = useCallback(
    (handler: KeypressHandler) => subscribers.add(handler),
    [subscribers],
  );
  const unsubscribe = useCallback(
    (handler: KeypressHandler) => subscribers.delete(handler),
    [subscribers],
  );
  const broadcast = useCallback(
    (key: Key) => subscribers.forEach((handler) => handler(key)),
    [subscribers],
  );

  useEffect(() => {
    if (isRawModeSupported) {
      setRawMode(true);
    }

    // Enable Bracketed Paste Mode
    stdout.write("\x1b[?2004h");

    let processor = nonKeyboardEventFilter(broadcast);
    if (!kittyProtocol) {
      processor = bufferFastReturn(processor);
    }
    processor = bufferBackslashEnter(processor);
    processor = bufferPaste(processor);
    const dataListener = createDataListener(processor, platform);

    stdin.on?.("data", dataListener);
    return () => {
      // Disable Bracketed Paste Mode
      stdout.write("\x1b[?2004l");
      stdin.off?.("data", dataListener);
      if (isRawModeSupported) {
        setRawMode(false);
      }
    };
  }, [
    stdin,
    broadcast,
    kittyProtocol,
    platform,
    setRawMode,
    isRawModeSupported,
    stdout,
  ]);

  return (
    <KeypressContext.Provider value={{ subscribe, unsubscribe }}>
      {children}
    </KeypressContext.Provider>
  );
}
