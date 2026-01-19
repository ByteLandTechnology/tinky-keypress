import { useContext } from "react";
import { KeypressContext } from "../contexts/KeypressContext.js";

/**
 * Hook to access the Keypress context.
 * Allows components to subscribe and unsubscribe to keypress events.
 *
 * @returns The Keypress context value containing subscribe and unsubscribe methods.
 * @throws Error if used outside of a KeypressProvider.
 */
export function useKeypressContext() {
  const context = useContext(KeypressContext);
  if (!context) {
    throw new Error(
      "useKeypressContext must be used within a KeypressProvider",
    );
  }
  return context;
}
