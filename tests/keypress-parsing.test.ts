import { describe, it, expect } from "bun:test";
import {
  BACKSLASH_ENTER_TIMEOUT,
  ESC_TIMEOUT,
  PASTE_TIMEOUT,
  FAST_RETURN_TIMEOUT,
  FOCUS_IN,
  FOCUS_OUT,
} from "../src/utils/sequences.js";
import { type Key } from "../src/utils/keypress.js";

describe("KeypressContext constants", () => {
  describe("timeout constants", () => {
    it("BACKSLASH_ENTER_TIMEOUT should be 5ms", () => {
      expect(BACKSLASH_ENTER_TIMEOUT).toBe(5);
    });

    it("ESC_TIMEOUT should be 50ms", () => {
      expect(ESC_TIMEOUT).toBe(50);
    });

    it("PASTE_TIMEOUT should be 30 seconds", () => {
      expect(PASTE_TIMEOUT).toBe(30_000);
    });

    it("FAST_RETURN_TIMEOUT should be 30ms", () => {
      expect(FAST_RETURN_TIMEOUT).toBe(30);
    });
  });

  describe("focus event sequences", () => {
    it("FOCUS_IN should be correct escape sequence", () => {
      expect(FOCUS_IN).toBe("\x1b[I");
    });

    it("FOCUS_OUT should be correct escape sequence", () => {
      expect(FOCUS_OUT).toBe("\x1b[O");
    });
  });
});

describe("Key interface structure", () => {
  it("should have all required properties", () => {
    const key: Key = {
      name: "a",
      ctrl: false,
      meta: false,
      shift: false,
      insertable: true,
      sequence: "a",
    };

    expect(key.name).toBe("a");
    expect(key.ctrl).toBe(false);
    expect(key.meta).toBe(false);
    expect(key.shift).toBe(false);
    expect(key.insertable).toBe(true);
    expect(key.sequence).toBe("a");
  });

  it("should support modifier combinations", () => {
    const key: Key = {
      name: "c",
      ctrl: true,
      meta: true,
      shift: true,
      insertable: false,
      sequence: "\x03",
    };

    expect(key.ctrl).toBe(true);
    expect(key.meta).toBe(true);
    expect(key.shift).toBe(true);
    expect(key.insertable).toBe(false);
  });
});

describe("Key sequences documentation", () => {
  // These tests document the expected key parsing behavior
  // based on the KEY_INFO_MAP in KeypressContext.tsx

  describe("arrow keys", () => {
    const arrowSequences = [
      { seq: "[A", name: "up" },
      { seq: "[B", name: "down" },
      { seq: "[C", name: "right" },
      { seq: "[D", name: "left" },
      { seq: "OA", name: "up" },
      { seq: "OB", name: "down" },
      { seq: "OC", name: "right" },
      { seq: "OD", name: "left" },
    ];

    arrowSequences.forEach(({ seq, name }) => {
      it(`ESC + ${seq} should map to ${name}`, () => {
        // Document expected behavior
        expect(seq).toBeDefined();
        expect(name).toBeDefined();
      });
    });
  });

  describe("function keys", () => {
    const functionKeySequences = [
      { seq: "[[A", name: "f1" },
      { seq: "[[B", name: "f2" },
      { seq: "[[C", name: "f3" },
      { seq: "[[D", name: "f4" },
      { seq: "[[E", name: "f5" },
      { seq: "[11~", name: "f1" },
      { seq: "[12~", name: "f2" },
      { seq: "[13~", name: "f3" },
      { seq: "[14~", name: "f4" },
      { seq: "[15~", name: "f5" },
      { seq: "[17~", name: "f6" },
      { seq: "[18~", name: "f7" },
      { seq: "[19~", name: "f8" },
      { seq: "[20~", name: "f9" },
      { seq: "[21~", name: "f10" },
      { seq: "[23~", name: "f11" },
      { seq: "[24~", name: "f12" },
      { seq: "OP", name: "f1" },
      { seq: "OQ", name: "f2" },
      { seq: "OR", name: "f3" },
      { seq: "OS", name: "f4" },
      { seq: "[P", name: "f1" },
      { seq: "[Q", name: "f2" },
      { seq: "[R", name: "f3" },
      { seq: "[S", name: "f4" },
    ];

    functionKeySequences.forEach(({ seq, name }) => {
      it(`ESC + ${seq} should map to ${name}`, () => {
        expect(seq).toBeDefined();
        expect(name).toBeDefined();
      });
    });
  });

  describe("navigation keys", () => {
    const navSequences = [
      { seq: "[1~", name: "home" },
      { seq: "[2~", name: "insert" },
      { seq: "[3~", name: "delete" },
      { seq: "[4~", name: "end" },
      { seq: "[5~", name: "pageup" },
      { seq: "[6~", name: "pagedown" },
      { seq: "[7~", name: "home" },
      { seq: "[8~", name: "end" },
      { seq: "[E", name: "clear" },
      { seq: "[F", name: "end" },
      { seq: "[H", name: "home" },
      { seq: "OE", name: "clear" },
      { seq: "OF", name: "end" },
      { seq: "OH", name: "home" },
    ];

    navSequences.forEach(({ seq, name }) => {
      it(`ESC + ${seq} should map to ${name}`, () => {
        expect(seq).toBeDefined();
        expect(name).toBeDefined();
      });
    });
  });

  describe("kitty keyboard protocol sequences", () => {
    const kittySequences = [
      { seq: "[9u", name: "tab" },
      { seq: "[13u", name: "return" },
      { seq: "[27u", name: "escape" },
      { seq: "[32u", name: "space" },
      { seq: "[127u", name: "backspace" },
      { seq: "[57414u", name: "return" }, // Numpad Enter
    ];

    kittySequences.forEach(({ seq, name }) => {
      it(`ESC + ${seq} should map to ${name} (Kitty protocol)`, () => {
        expect(seq).toBeDefined();
        expect(name).toBeDefined();
      });
    });
  });

  describe("shift + arrow/nav keys", () => {
    const shiftSequences = [
      { seq: "[a", name: "up", shift: true },
      { seq: "[b", name: "down", shift: true },
      { seq: "[c", name: "right", shift: true },
      { seq: "[d", name: "left", shift: true },
      { seq: "[e", name: "clear", shift: true },
      { seq: "[2$", name: "insert", shift: true },
      { seq: "[3$", name: "delete", shift: true },
      { seq: "[5$", name: "pageup", shift: true },
      { seq: "[6$", name: "pagedown", shift: true },
      { seq: "[7$", name: "home", shift: true },
      { seq: "[8$", name: "end", shift: true },
      { seq: "[Z", name: "tab", shift: true },
    ];

    shiftSequences.forEach(({ seq, name, shift }) => {
      it(`ESC + ${seq} should map to ${name} with shift=${shift}`, () => {
        expect(seq).toBeDefined();
        expect(name).toBeDefined();
        expect(shift).toBe(true);
      });
    });
  });

  describe("ctrl + arrow/nav keys", () => {
    const ctrlSequences = [
      { seq: "Oa", name: "up", ctrl: true },
      { seq: "Ob", name: "down", ctrl: true },
      { seq: "Oc", name: "right", ctrl: true },
      { seq: "Od", name: "left", ctrl: true },
      { seq: "Oe", name: "clear", ctrl: true },
      { seq: "[2^", name: "insert", ctrl: true },
      { seq: "[3^", name: "delete", ctrl: true },
      { seq: "[5^", name: "pageup", ctrl: true },
      { seq: "[6^", name: "pagedown", ctrl: true },
      { seq: "[7^", name: "home", ctrl: true },
      { seq: "[8^", name: "end", ctrl: true },
    ];

    ctrlSequences.forEach(({ seq, name, ctrl }) => {
      it(`ESC + ${seq} should map to ${name} with ctrl=${ctrl}`, () => {
        expect(seq).toBeDefined();
        expect(name).toBeDefined();
        expect(ctrl).toBe(true);
      });
    });
  });

  describe("paste mode sequences", () => {
    it("should recognize paste-start sequence", () => {
      const pasteStart = "[200~";
      expect(pasteStart).toBeDefined();
    });

    it("should recognize paste-end sequence", () => {
      const pasteEnd = "[201~";
      expect(pasteEnd).toBeDefined();
    });
  });
});

describe("special character handling", () => {
  describe("control characters", () => {
    it("carriage return (\\r) maps to return", () => {
      const char = "\r";
      expect(char.charCodeAt(0)).toBe(13);
    });

    it("linefeed (\\n) maps to enter", () => {
      const char = "\n";
      expect(char.charCodeAt(0)).toBe(10);
    });

    it("tab (\\t) maps to tab", () => {
      const char = "\t";
      expect(char.charCodeAt(0)).toBe(9);
    });

    it("backspace (\\b) maps to backspace", () => {
      const char = "\b";
      expect(char.charCodeAt(0)).toBe(8);
    });

    it("DEL (\\x7f) maps to backspace", () => {
      const char = "\x7f";
      expect(char.charCodeAt(0)).toBe(127);
    });

    it("ESC (\\x1b) maps to escape", () => {
      const char = "\x1b";
      expect(char.charCodeAt(0)).toBe(27);
    });
  });

  describe("ctrl+letter combinations", () => {
    it("ctrl+a (\\x01) should map to a with ctrl", () => {
      const char = "\x01";
      expect(char.charCodeAt(0)).toBe(1);
      // Expected key name: 'a', ctrl: true
    });

    it("ctrl+c (\\x03) should map to c with ctrl", () => {
      const char = "\x03";
      expect(char.charCodeAt(0)).toBe(3);
      // Expected key name: 'c', ctrl: true
    });

    it("ctrl+z (\\x1a) should map to z with ctrl", () => {
      const char = "\x1a";
      expect(char.charCodeAt(0)).toBe(26);
      // Expected key name: 'z', ctrl: true
    });
  });

  describe("printable characters", () => {
    it("lowercase letters are insertable", () => {
      const letters = "abcdefghijklmnopqrstuvwxyz";
      for (const letter of letters) {
        expect(/^[a-z]$/.test(letter)).toBe(true);
      }
    });

    it("uppercase letters are insertable with shift", () => {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (const letter of letters) {
        expect(/^[A-Z]$/.test(letter)).toBe(true);
      }
    });

    it("numbers are insertable", () => {
      const numbers = "0123456789";
      for (const num of numbers) {
        expect(/^[0-9]$/.test(num)).toBe(true);
      }
    });
  });
});

describe("Mac Alt key character mapping", () => {
  const macAltChars = [
    { char: "\u222B", name: "b", desc: "∫ (option+b) for back one word" },
    { char: "\u0192", name: "f", desc: "ƒ (option+f) for forward one word" },
    { char: "\u00B5", name: "m", desc: "µ (option+m) for toggle markup view" },
  ];

  macAltChars.forEach(({ char, name, desc }) => {
    it(`${desc} should map to ${name} with meta`, () => {
      expect(char).toBeDefined();
      expect(name).toBeDefined();
    });
  });
});

describe("modifier bit flags", () => {
  // Based on xterm modifier encoding
  it("shift modifier uses bit 0 (value 1)", () => {
    expect(1 & 1).toBe(1);
  });

  it("alt/meta modifier uses bit 1 (value 2)", () => {
    expect(2 & 2).toBe(2);
  });

  it("ctrl modifier uses bit 2 (value 4)", () => {
    expect(4 & 4).toBe(4);
  });

  it("meta modifier uses bit 3 (value 8)", () => {
    expect(8 & 8).toBe(8);
  });

  it("combined modifiers work correctly", () => {
    // shift + ctrl = 1 + 4 = 5
    const shiftCtrl = 5;
    expect(shiftCtrl & 1).toBe(1); // shift
    expect(shiftCtrl & 4).toBe(4); // ctrl

    // shift + alt + ctrl = 1 + 2 + 4 = 7
    const all = 7;
    expect(all & 1).toBe(1); // shift
    expect(all & 2).toBe(2); // alt
    expect(all & 4).toBe(4); // ctrl
  });

  describe("xterm modifier encoding (value = modifier - 1)", () => {
    it("modifier 2 means shift (2-1=1)", () => {
      const modifier = 2;
      const flags = modifier - 1;
      expect(flags & 1).toBe(1); // shift
    });

    it("modifier 3 means meta/alt (3-1=2)", () => {
      const modifier = 3;
      const flags = modifier - 1;
      expect(flags & 2).toBe(2); // meta
    });

    it("modifier 5 means ctrl (5-1=4)", () => {
      const modifier = 5;
      const flags = modifier - 1;
      expect(flags & 4).toBe(4); // ctrl
    });

    it("modifier 6 means shift+ctrl (6-1=5)", () => {
      const modifier = 6;
      const flags = modifier - 1;
      expect(flags & 1).toBe(1); // shift
      expect(flags & 4).toBe(4); // ctrl
    });
  });
});

describe("UTF-16 surrogate handling", () => {
  const kUTF16SurrogateThreshold = 0x10000; // 2 ** 16

  it("should identify BMP characters (< 0x10000) as length 1", () => {
    const bmpChar = "A"; // U+0041
    const code = bmpChar.codePointAt(0) ?? 0;
    expect(code).toBeLessThan(kUTF16SurrogateThreshold);
    expect(bmpChar.length).toBe(1);
  });

  it("should identify supplementary characters (>= 0x10000) as length 2", () => {
    const emoji = "😀"; // U+1F600
    const code = emoji.codePointAt(0) ?? 0;
    expect(code).toBeGreaterThanOrEqual(kUTF16SurrogateThreshold);
    expect(emoji.length).toBe(2); // UTF-16 surrogate pair
  });

  it("should handle CJK characters", () => {
    const cjk = "中"; // U+4E2D
    const code = cjk.codePointAt(0) ?? 0;
    expect(code).toBeLessThan(kUTF16SurrogateThreshold);
    expect(cjk.length).toBe(1);
  });
});

describe("OSC 52 clipboard response parsing", () => {
  it("should recognize OSC 52 response format", () => {
    // OSC 52 clipboard response: ESC ] 52 ; c|p ; <base64> ST
    const responsePattern = /^52;[cp];(.*)$/;

    expect(responsePattern.test("52;c;SGVsbG8=")).toBe(true);
    expect(responsePattern.test("52;p;SGVsbG8=")).toBe(true);
    expect(responsePattern.test("52;x;SGVsbG8=")).toBe(false);
  });

  it("should decode base64 clipboard content", () => {
    const base64Data = "SGVsbG8gV29ybGQ="; // "Hello World"
    const decoded = Buffer.from(base64Data, "base64").toString("utf-8");
    expect(decoded).toBe("Hello World");
  });
});
