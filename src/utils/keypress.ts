/* eslint-disable no-control-regex */
import {
  BACKSLASH_ENTER_TIMEOUT,
  ESC,
  ESC_TIMEOUT,
  FAST_RETURN_TIMEOUT,
  FOCUS_IN,
  FOCUS_OUT,
  KEY_INFO_MAP,
  MAC_ALT_KEY_CHARACTER_MAP,
  PASTE_TIMEOUT,
} from "./sequences.js";

// Simple check for mouse escape sequences to filter them out
// SGR format: ESC [ < ... m/M
// X11 format: ESC [ M ...
export function isMouseSequence(sequence: string): boolean {
  if (!sequence.startsWith(ESC)) return false;
  // SGR mouse: ESC [ < number ; number ; number m/M
  if (/^\x1b\[<\d+;\d+;\d+[mM]$/.test(sequence)) return true;
  // X11 mouse: ESC [ M followed by 3 chars
  if (/^\x1b\[M[\s\S]{3}$/.test(sequence)) return true;
  return false;
}

export const kUTF16SurrogateThreshold = 0x10000; // 2 ** 16
export function charLengthAt(str: string, i: number): number {
  if (str.length <= i) {
    // Pretend to move to the right. This is necessary to autocomplete while
    // moving to the right.
    return 1;
  }
  const code = str.codePointAt(i);
  return code !== undefined && code >= kUTF16SurrogateThreshold ? 2 : 1;
}

/**
 * Represents a parsed key press event.
 */
export interface Key {
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  insertable: boolean;
  sequence: string;
}

/**
 * Handler function type for keypress events.
 * @param key - The parsed key event.
 * @param raw - The original raw string sequence that triggered the event.
 */
export type KeypressHandler = (key: Key, raw: string) => void;

export function nonKeyboardEventFilter(
  keypressHandler: KeypressHandler,
): KeypressHandler {
  return (key: Key, raw: string) => {
    if (
      !isMouseSequence(key.sequence) &&
      key.sequence !== FOCUS_IN &&
      key.sequence !== FOCUS_OUT
    ) {
      keypressHandler(key, raw);
    }
  };
}

/**
 * Converts return keys pressed quickly after other keys into plain
 * insertable return characters.
 *
 * This is to accommodate older terminals that paste text without bracketing.
 */
export function bufferFastReturn(
  keypressHandler: KeypressHandler,
): KeypressHandler {
  let lastKeyTime = 0;
  return (key: Key, raw: string) => {
    const now = Date.now();
    if (key.name === "return" && now - lastKeyTime <= FAST_RETURN_TIMEOUT) {
      keypressHandler(
        {
          ...key,
          name: "return",
          sequence: "\r",
          insertable: true,
        },
        raw,
      );
    } else {
      keypressHandler(key, raw);
    }
    lastKeyTime = now;
  };
}

/**
 * Buffers "/" keys to see if they are followed return.
 * Will flush the buffer if no data is received for DRAG_COMPLETION_TIMEOUT_MS
 * or when a null key is received.
 */
export function bufferBackslashEnter(
  keypressHandler: KeypressHandler,
): KeypressHandler {
  const bufferer = (function* (): Generator<
    void,
    void,
    { key: Key; raw: string } | null
  > {
    while (true) {
      const event = yield;

      if (event == null) {
        continue;
      }
      const { key, raw } = event;

      if (key.sequence !== "\\") {
        keypressHandler(key, raw);
        continue;
      }

      const timeoutId = setTimeout(
        () => bufferer.next(null),
        BACKSLASH_ENTER_TIMEOUT,
      );
      const nextEvent = yield;
      clearTimeout(timeoutId);

      if (nextEvent === null) {
        keypressHandler(key, raw);
      } else {
        const { key: nextKey, raw: nextRaw } = nextEvent;
        if (nextKey.name === "return") {
          keypressHandler(
            {
              ...nextKey,
              shift: true,
              sequence: "\r", // Corrected escaping for newline
            },
            raw + nextRaw,
          );
        } else {
          keypressHandler(key, raw);
          keypressHandler(nextKey, nextRaw);
        }
      }
    }
  })();

  bufferer.next(); // prime the generator so it starts listening.

  return (key: Key, raw: string) => bufferer.next({ key, raw });
}

/**
 * Buffers paste events between paste-start and paste-end sequences.
 * Will flush the buffer if no data is received for PASTE_TIMEOUT ms or
 * when a null key is received.
 */
export function bufferPaste(keypressHandler: KeypressHandler): KeypressHandler {
  const bufferer = (function* (): Generator<
    void,
    void,
    { key: Key; raw: string } | null
  > {
    while (true) {
      let event = yield;

      if (event === null) {
        continue;
      }

      const { key, raw } = event;

      if (key.name !== "paste-start") {
        keypressHandler(key, raw);
        continue;
      }

      const rawStart = raw;
      let buffer = "";
      let rawInner = "";

      while (true) {
        const timeoutId = setTimeout(() => bufferer.next(null), PASTE_TIMEOUT);
        event = yield;
        clearTimeout(timeoutId);

        if (event === null) {
          // Paste timeout occurred - data may be truncated
          break;
        }

        const { key: nextKey, raw: nextRaw } = event;

        if (nextKey.name === "paste-end") {
          // Add paste-end raw to rawBuffer? Actually we need to emit it?
          // The bufferPaste logic emits a single PASTE event.
          // The raw sequence should be paste-start + inner + paste-end.
          // So rawStart + rawInner + nextRaw.
          if (buffer.length > 0) {
            keypressHandler(
              {
                name: "paste",
                ctrl: false,
                meta: false,
                shift: false,
                insertable: true,
                sequence: buffer,
              },
              rawStart + rawInner + nextRaw,
            );
          }
          break;
        }
        buffer += nextKey.sequence;
        rawInner += nextRaw;
      }
    }
  })();
  bufferer.next(); // prime the generator so it starts listening.

  return (key: Key, raw: string) => bufferer.next({ key, raw });
}

/**
 * Turns raw data strings into keypress events sent to the provided handler.
 * Buffers escape sequences until a full sequence is received or
 * until a timeout occurs.
 */
export function createDataListener(
  keypressHandler: KeypressHandler,
  platform?: string,
) {
  const parser = emitKeys(keypressHandler, platform);
  parser.next(); // prime the generator so it starts listening.

  let timeoutId: ReturnType<typeof setTimeout>;
  return (data: unknown) => {
    if (typeof data !== "string" && !Buffer.isBuffer(data)) {
      return;
    }
    const input = typeof data === "string" ? data : data.toString("utf8");
    clearTimeout(timeoutId);
    for (const char of input) {
      parser.next(char);
    }
    if (input.length !== 0) {
      timeoutId = setTimeout(() => parser.next(""), ESC_TIMEOUT);
    }
  };
}

/**
 * Translates raw keypress characters into key events.
 * Buffers escape sequences until a full sequence is received or
 * until an empty string is sent to indicate a timeout.
 */
export function* emitKeys(
  keypressHandler: KeypressHandler,
  platform?: string,
): Generator<void, void, string> {
  while (true) {
    let ch = yield;
    let sequence = ch;
    let escaped = false;

    let name = undefined;
    let ctrl = false;
    let meta = false;
    let shift = false;
    let code = undefined;
    let insertable = false;

    if (ch === ESC) {
      escaped = true;
      ch = yield;
      sequence += ch;

      if (ch === ESC) {
        ch = yield;
        sequence += ch;
      }
    }

    if (escaped && (ch === "O" || ch === "[" || ch === "]")) {
      // ANSI escape sequence
      code = ch;
      let modifier = 0;

      if (ch === "]") {
        // OSC sequence
        // ESC ] <params> ; <data> BEL
        // ESC ] <params> ; <data> ESC \
        let buffer = "";

        // Read until BEL, `ESC \`, or timeout (empty string)
        while (true) {
          const next = yield;
          if (next === "" || next === "\u0007") {
            break;
          } else if (next === ESC) {
            const afterEsc = yield;
            if (afterEsc === "" || afterEsc === "\\") {
              break;
            }
            buffer += next + afterEsc;
            continue;
          }
          buffer += next;
        }

        // Check for OSC 52 (Clipboard) response
        // Format: 52;c;<base64> or 52;p;<base64>
        const match = /^52;[cp];(.*)$/.exec(buffer);
        if (match) {
          try {
            const base64Data = match[1];
            const decoded = Buffer.from(base64Data, "base64").toString("utf-8");
            keypressHandler(
              {
                name: "paste",
                ctrl: false,
                meta: false,
                shift: false,
                insertable: true,
                sequence: decoded,
              },
              sequence + buffer,
            );
          } catch {
            // Ignore error
          }
        }

        continue; // resume main loop
      } else if (ch === "O") {
        // ESC O letter
        // ESC O modifier letter
        ch = yield;
        sequence += ch;

        if (ch >= "0" && ch <= "9") {
          modifier = parseInt(ch, 10) - 1;
          ch = yield;
          sequence += ch;
        }

        code += ch;
      } else if (ch === "[") {
        // ESC [ letter
        // ESC [ modifier letter
        // ESC [ [ modifier letter
        // ESC [ [ num char
        ch = yield;
        sequence += ch;

        if (ch === "[") {
          // \x1b[[A
          //      ^--- escape codes might have a second bracket
          code += ch;
          ch = yield;
          sequence += ch;
        }

        /*
         * Here and later we try to buffer just enough data to get
         * a complete ascii sequence.
         *
         * We have basically two classes of ascii characters to process:
         *
         *
         * 1. `\x1b[24;5~` should be parsed as { code: '[24~', modifier: 5 }
         *
         * This particular example is featuring Ctrl+F12 in xterm.
         *
         *  - `;5` part is optional, e.g. it could be `\x1b[24~`
         *  - first part can contain one or two digits
         *  - there is also special case when there can be 3 digits
         *    but without modifier. They are the case of paste bracket mode
         *
         * So the generic regexp is like /^(?:\d\d?(;\d)?[~^$]|\d{3}~)$/
         *
         *
         * 2. `\x1b[1;5H` should be parsed as { code: '[H', modifier: 5 }
         *
         * This particular example is featuring Ctrl+Home in xterm.
         *
         *  - `1;5` part is optional, e.g. it could be `\x1b[H`
         *  - `1;` part is optional, e.g. it could be `\x1b[5H`
         *
         * So the generic regexp is like /^((\d;)?\d)?[A-Za-z]$/
         *
         *
         */
        const cmdStart = sequence.length - 1;

        // collect as many digits as possible
        while (ch >= "0" && ch <= "9") {
          ch = yield;
          sequence += ch;
        }

        // skip modifier
        if (ch === ";") {
          while (ch === ";") {
            ch = yield;
            sequence += ch;

            // collect as many digits as possible
            while (ch >= "0" && ch <= "9") {
              ch = yield;
              sequence += ch;
            }
          }
        } else if (ch === "<") {
          // SGR mouse mode
          ch = yield;
          sequence += ch;
          // Don't skip on empty string here to avoid timeouts on slow events.
          while (ch === "" || ch === ";" || (ch >= "0" && ch <= "9")) {
            ch = yield;
            sequence += ch;
          }
        } else if (ch === "M") {
          // X11 mouse mode
          // three characters after 'M'
          ch = yield;
          sequence += ch;
          ch = yield;
          sequence += ch;
          ch = yield;
          sequence += ch;
        }

        /*
         * We buffered enough data, now trying to extract code
         * and modifier from it
         */
        const cmd = sequence.slice(cmdStart);
        let match;

        if ((match = /^(\d+)(?:;(\d+))?(?:;(\d+))?([~^$u])$/.exec(cmd))) {
          if (match[1] === "27" && match[3] && match[4] === "~") {
            // modifyOtherKeys format: CSI 27 ; modifier ; key ~
            // Treat as CSI u: key + 'u'
            code += match[3] + "u";
            modifier = parseInt(match[2] ?? "1", 10) - 1;
          } else {
            code += match[1] + match[4];
            // Defaults to '1' if no modifier exists, resulting in a 0 modifier value
            modifier = parseInt(match[2] ?? "1", 10) - 1;
          }
        } else if ((match = /^(\d+)?(?:;(\d+))?([A-Za-z])$/.exec(cmd))) {
          code += match[3];
          modifier = parseInt(match[2] ?? match[1] ?? "1", 10) - 1;
        } else {
          code += cmd;
        }
      }

      // Parse the key modifier
      ctrl = !!(modifier & 4);
      meta = !!(modifier & 10); // use 10 to catch both alt (2) and meta (8).
      shift = !!(modifier & 1);

      const keyInfo = KEY_INFO_MAP[code];
      if (keyInfo) {
        name = keyInfo.name;
        if (keyInfo.shift) {
          shift = true;
        }
        if (keyInfo.ctrl) {
          ctrl = true;
        }
        if (name === "space" && !ctrl && !meta) {
          sequence = " ";
          insertable = true;
        }
      } else {
        name = "undefined";
        if ((ctrl || meta) && (code.endsWith("u") || code.endsWith("~"))) {
          // CSI-u or tilde-coded functional keys: ESC [ <code> ; <mods> (u|~)
          const codeNumber = parseInt(code.slice(1, -1), 10);
          if (
            codeNumber >= "a".charCodeAt(0) &&
            codeNumber <= "z".charCodeAt(0)
          ) {
            name = String.fromCharCode(codeNumber);
          }
        }
      }
    } else if (ch === "\r") {
      // carriage return
      name = "return";
      meta = escaped;
    } else if (ch === "\n") {
      // Enter, should have been called linefeed
      name = "enter";
      meta = escaped;
    } else if (ch === "\t") {
      // tab
      name = "tab";
      meta = escaped;
    } else if (ch === "\b" || ch === "\x7f") {
      // backspace or ctrl+h
      name = "backspace";
      meta = escaped;
    } else if (ch === ESC) {
      // escape key
      name = "escape";
      meta = escaped;
    } else if (ch === " ") {
      name = "space";
      meta = escaped;
      insertable = true;
    } else if (!escaped && ch <= "\x1a") {
      // ctrl+letter
      name = String.fromCharCode(ch.charCodeAt(0) + "a".charCodeAt(0) - 1);
      ctrl = true;
    } else if (/^[0-9A-Za-z]$/.exec(ch) !== null) {
      // Letter, number, shift+letter
      name = ch.toLowerCase();
      shift = /^[A-Z]$/.exec(ch) !== null;
      meta = escaped;
      insertable = true;
    } else if (MAC_ALT_KEY_CHARACTER_MAP[ch] && platform === "darwin") {
      name = MAC_ALT_KEY_CHARACTER_MAP[ch];
      meta = true;
    } else if (sequence === `${ESC}${ESC}`) {
      // Double escape
      name = "escape";
      meta = true;

      // Emit first escape key here, then continue processing
      keypressHandler(
        {
          name: "escape",
          ctrl,
          meta,
          shift,
          insertable: false,
          sequence: ESC,
        },
        ESC,
      );
    } else if (escaped) {
      // Escape sequence timeout
      name = ch.length ? undefined : "escape";
      meta = true;
    } else {
      // Any other character is considered printable.
      insertable = true;
    }

    if (
      (sequence.length !== 0 && (name !== undefined || escaped)) ||
      charLengthAt(sequence, 0) === sequence.length
    ) {
      keypressHandler(
        {
          name: name || "",
          ctrl,
          meta,
          shift,
          insertable,
          sequence,
        },
        sequence,
      );
    }
    // Unrecognized or broken escape sequence, don't emit anything
  }
}
