// ESC character constant (escape key)
export const ESC = "\x1b";

/** Timeout for waiting for a return after a backslash to detect escaped newlines */
export const BACKSLASH_ENTER_TIMEOUT = 5;
/** Timeout for waiting for more characters in an escape sequence */
export const ESC_TIMEOUT = 50;
/** Timeout for waiting for paste end sequence */
export const PASTE_TIMEOUT = 30_000;
/** Timeout for discriminating between a fast return key and a pasted newline */
export const FAST_RETURN_TIMEOUT = 30;

/** Focus in sequence */
export const FOCUS_IN = "\x1b[I";
/** Focus out sequence */
export const FOCUS_OUT = "\x1b[O";

// Parse the key itself
export const KEY_INFO_MAP: Record<
  string,
  { name: string; shift?: boolean; ctrl?: boolean }
> = {
  "[200~": { name: "paste-start" },
  "[201~": { name: "paste-end" },
  "[[A": { name: "f1" },
  "[[B": { name: "f2" },
  "[[C": { name: "f3" },
  "[[D": { name: "f4" },
  "[[E": { name: "f5" },
  "[1~": { name: "home" },
  "[2~": { name: "insert" },
  "[3~": { name: "delete" },
  "[4~": { name: "end" },
  "[5~": { name: "pageup" },
  "[6~": { name: "pagedown" },
  "[7~": { name: "home" },
  "[8~": { name: "end" },
  "[11~": { name: "f1" },
  "[12~": { name: "f2" },
  "[13~": { name: "f3" },
  "[14~": { name: "f4" },
  "[15~": { name: "f5" },
  "[17~": { name: "f6" },
  "[18~": { name: "f7" },
  "[19~": { name: "f8" },
  "[20~": { name: "f9" },
  "[21~": { name: "f10" },
  "[23~": { name: "f11" },
  "[24~": { name: "f12" },
  "[A": { name: "up" },
  "[B": { name: "down" },
  "[C": { name: "right" },
  "[D": { name: "left" },
  "[E": { name: "clear" },
  "[F": { name: "end" },
  "[H": { name: "home" },
  "[P": { name: "f1" },
  "[Q": { name: "f2" },
  "[R": { name: "f3" },
  "[S": { name: "f4" },
  OA: { name: "up" },
  OB: { name: "down" },
  OC: { name: "right" },
  OD: { name: "left" },
  OE: { name: "clear" },
  OF: { name: "end" },
  OH: { name: "home" },
  OP: { name: "f1" },
  OQ: { name: "f2" },
  OR: { name: "f3" },
  OS: { name: "f4" },
  "[[5~": { name: "pageup" },
  "[[6~": { name: "pagedown" },
  "[9u": { name: "tab" },
  "[13u": { name: "return" },
  "[27u": { name: "escape" },
  "[32u": { name: "space" },
  "[127u": { name: "backspace" },
  "[57414u": { name: "return" }, // Numpad Enter
  "[a": { name: "up", shift: true },
  "[b": { name: "down", shift: true },
  "[c": { name: "right", shift: true },
  "[d": { name: "left", shift: true },
  "[e": { name: "clear", shift: true },
  "[2$": { name: "insert", shift: true },
  "[3$": { name: "delete", shift: true },
  "[5$": { name: "pageup", shift: true },
  "[6$": { name: "pagedown", shift: true },
  "[7$": { name: "home", shift: true },
  "[8$": { name: "end", shift: true },
  "[Z": { name: "tab", shift: true },
  Oa: { name: "up", ctrl: true },
  Ob: { name: "down", ctrl: true },
  Oc: { name: "right", ctrl: true },
  Od: { name: "left", ctrl: true },
  Oe: { name: "clear", ctrl: true },
  "[2^": { name: "insert", ctrl: true },
  "[3^": { name: "delete", ctrl: true },
  "[5^": { name: "pageup", ctrl: true },
  "[6^": { name: "pagedown", ctrl: true },
  "[7^": { name: "home", ctrl: true },
  "[8^": { name: "end", ctrl: true },
};

export const MAC_ALT_KEY_CHARACTER_MAP: Record<string, string> = {
  "\u222B": "b", // "∫" back one word
  "\u0192": "f", // "ƒ" forward one word
  "\u00B5": "m", // "µ" toggle markup view
};
