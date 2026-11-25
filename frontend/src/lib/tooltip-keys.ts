//
// Works out what a key press does to a pinnable tooltip, so the tooltip's keyboard listener stays
// a thin layer over plain code. As in the style guide's pinnable tooltip, P pins an open tooltip
// and closes a pinned one. Escape closes either.
//

//
// The key that pins the tooltip open under the pointer and closes a pinned one, as in the style
// guide.
//
export const PIN_KEY = "p";

//
// What a key press does to a pinnable tooltip: pins it, closes it or leaves it so the key goes on
// to the page.
//
export type TooltipKeyAction = "pin" | "close" | "none";

//
// The parts of a key press the tooltip looks at.
//
export interface ITooltipKeyPress {
    // The key, as KeyboardEvent.key gives it.
    key: string;

    // Whether Control, Alt or Meta was held, which leaves the key to the page's shortcuts.
    hasModifier: boolean;

    // Whether the key went to a text box, where P types a letter.
    isTyping: boolean;
}

//
// Works out what the key press does to an open or pinned tooltip. Escape closes it. P pins an open
// one and closes a pinned one. Any other key, a key with a modifier held or a key typed into a
// text box leaves the tooltip as it is, so the key reaches the page as usual.
//
export function tooltipKeyAction(press: ITooltipKeyPress, isPinned: boolean): TooltipKeyAction {
    if (press.hasModifier) {
        return "none";
    }
    if (press.isTyping) {
        return "none";
    }
    if (press.key === "Escape") {
        return "close";
    }
    if (press.key.toLowerCase() !== PIN_KEY) {
        return "none";
    }
    if (isPinned) {
        return "close";
    }
    return "pin";
}

//
// Works out whether the key press went to a text box, an input, a text area or an element the user
// can edit, where P types a letter rather than pinning a tooltip.
//
export function isTypingTarget(target: EventTarget | null): boolean {
    if (target instanceof HTMLElement) {
        return target.closest("input, textarea, [contenteditable='true']") !== null;
    }
    return false;
}
