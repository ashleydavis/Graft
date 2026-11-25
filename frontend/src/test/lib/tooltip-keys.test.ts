//
// Tests what a key press does to a pinnable tooltip: P pins an open tooltip and closes a pinned
// one. Escape closes either. Any other key, a key with a modifier and a key typed into a text box
// leave it. It also checks which targets count as text boxes.
//

import { isTypingTarget, PIN_KEY, tooltipKeyAction } from "../../lib/tooltip-keys";

describe("tooltipKeyAction", () => {
    test("pins an open tooltip with P, in either case", () => {
        expect(PIN_KEY).toBe("p");
        expect(tooltipKeyAction({
            key: "p",
            hasModifier: false,
            isTyping: false,
        }, false)).toBe("pin");
        expect(tooltipKeyAction({
            key: "P",
            hasModifier: false,
            isTyping: false,
        }, false)).toBe("pin");
    });

    test("closes a pinned tooltip with P", () => {
        expect(tooltipKeyAction({
            key: "p",
            hasModifier: false,
            isTyping: false,
        }, true)).toBe("close");
    });

    test("closes an open or pinned tooltip with Escape", () => {
        expect(tooltipKeyAction({
            key: "Escape",
            hasModifier: false,
            isTyping: false,
        }, false)).toBe("close");
        expect(tooltipKeyAction({
            key: "Escape",
            hasModifier: false,
            isTyping: false,
        }, true)).toBe("close");
    });

    test("leaves any other key, a key with a modifier and a key typed into a text box", () => {
        expect(tooltipKeyAction({
            key: "ArrowDown",
            hasModifier: false,
            isTyping: false,
        }, true)).toBe("none");
        expect(tooltipKeyAction({
            key: "p",
            hasModifier: true,
            isTyping: false,
        }, false)).toBe("none");
        expect(tooltipKeyAction({
            key: "Escape",
            hasModifier: false,
            isTyping: true,
        }, true)).toBe("none");
    });
});

describe("isTypingTarget", () => {
    test("counts an input, a text area, an element the user can edit and anything inside one", () => {
        expect(isTypingTarget(document.createElement("input"))).toBe(true);
        expect(isTypingTarget(document.createElement("textarea"))).toBe(true);
        const editable = document.createElement("div");
        editable.setAttribute("contenteditable", "true");
        const inside = document.createElement("span");
        editable.appendChild(inside);
        expect(isTypingTarget(inside)).toBe(true);
    });

    test("counts no other element and no target", () => {
        expect(isTypingTarget(document.createElement("button"))).toBe(false);
        expect(isTypingTarget(null)).toBe(false);
        expect(isTypingTarget(window)).toBe(false);
    });
});
