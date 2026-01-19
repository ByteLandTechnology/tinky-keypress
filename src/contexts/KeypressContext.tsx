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

export interface KeypressContextValue {
  subscribe: (handler: KeypressHandler) => void;
  unsubscribe: (handler: KeypressHandler) => void;
}

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
