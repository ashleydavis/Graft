//
// Tests Graft's shared tooltip: renders each kind on an element, rests the pointer on it and checks
// the tooltip shows its content: the label, the label with its shortcut, the title with its
// detail, the full text and the fields with their copy buttons. It checks each copy button writes
// its field to the clipboard and shows a tick for a while. It checks the pinnable tooltip pins and
// closes with its button, P and Escape and stays open after the pointer leaves while pinned. It
// checks the tooltip leaves keys typed into a text box or pressed with a modifier alone and keeps
// P and Escape from the page's own key listener on the document while it is open.
//

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, ReactElement, ReactNode } from "react";
import { codeField, CopyTip, DetailTooltip, fieldValueClasses, firstFieldAction, FullTextTooltip, LabelTooltip, multilineField, PinnableTooltip, ShortcutTooltip, textField, tipButtonFillClass } from "../../components/tooltip";
import { COPIED_DURATION_MS } from "../../lib/clipboard";

//
// Puts a fake clipboard on the navigator whose writeText is the mock, because jsdom has none.
//
function installFakeClipboard(writeText: jest.Mock): void {
    Object.defineProperty(navigator, "clipboard", {
        value: {
            writeText,
        },
        configurable: true,
    });
}

//
// The element each test puts a tooltip on.
//
function target(): ReactElement {
    return createElement("button", {
        "data-id": "the-target",
    }, "Target");
}

//
// Renders a pinnable tooltip of a commit's hash fields on the target.
//
function renderPinnable(): void {
    render(createElement(PinnableTooltip, {
        dataId: "the-tip",
        enterDelayMs: 0,
        maxWidth: "200px",
        tip: (pinButton: ReactNode) => createElement(CopyTip, {
            fields: [codeField("Commit hash", "a1b2c3d4e5f6"), codeField("Short hash", "a1b2c3d")],
            action: pinButton,
        }),
        children: target(),
    }));
}

//
// Rests the pointer on the target and waits for the pinnable tooltip to show.
//
async function openPinnable(): Promise<void> {
    fireEvent.mouseOver(screen.getByText("Target"));
    await screen.findByText("a1b2c3d4e5f6");
}

//
// Reads whether the pinnable tooltip's body is on the page.
//
function isTipShown(): boolean {
    return document.querySelector("[data-id=\"the-tip\"]") !== null;
}

//
// Reads the pin button, failing the test when it is not on the page.
//
function pinButton(): HTMLElement {
    return screen.getByLabelText(/the tooltip/);
}

afterEach(() => {
    jest.useRealTimers();
});

describe("LabelTooltip", () => {
    test("shows its label when the pointer rests on its element", async () => {
        render(createElement(LabelTooltip, {
            label: "Close",
            placement: "bottom",
            children: target(),
        }));
        fireEvent.mouseOver(screen.getByText("Target"));
        const tooltip = await screen.findByRole("tooltip");
        expect(tooltip.textContent).toBe("Close");
    });

    test("opens to the right of its element when asked to", async () => {
        render(createElement(LabelTooltip, {
            label: "Welcome",
            placement: "right",
            children: target(),
        }));
        fireEvent.mouseOver(screen.getByText("Target"));
        const tooltip = await screen.findByRole("tooltip");
        expect(tooltip.getAttribute("data-popper-placement")).toBe("right");
    });
});

describe("ShortcutTooltip", () => {
    test("shows its label with the shortcut after it in the code font", async () => {
        render(createElement(ShortcutTooltip, {
            label: "Show keyboard shortcuts",
            shortcut: "Ctrl+/",
            dataId: "the-shortcut-tip",
            children: target(),
        }));
        fireEvent.mouseOver(screen.getByText("Target"));
        const tooltip = await screen.findByRole("tooltip");
        const content = tooltip.querySelector("[data-id=\"the-shortcut-tip\"]");
        expect(content?.textContent).toBe("Show keyboard shortcutsCtrl+/");
        expect(content?.lastElementChild?.className).toContain("font-[family-name:var(--font-mono)]");
    });
});

describe("DetailTooltip", () => {
    test("shows its title in bold above its detail", async () => {
        render(createElement(DetailTooltip, {
            title: "Stage this file",
            detail: "Adds the file's changes to the next commit.",
            children: target(),
        }));
        fireEvent.mouseOver(screen.getByText("Target"));
        const title = await screen.findByText("Stage this file");
        expect(title.className).toContain("font-[var(--weight-bold)]");
        expect(title.nextElementSibling?.textContent).toBe("Adds the file's changes to the next commit.");
    });
});

describe("FullTextTooltip", () => {
    test("shows the whole value", async () => {
        render(createElement(FullTextTooltip, {
            text: "src/graph/lanes.ts",
            dataId: "the-full-text",
            children: target(),
        }));
        fireEvent.mouseOver(screen.getByText("Target"));
        const text = await screen.findByText("src/graph/lanes.ts");
        expect(text.getAttribute("data-id")).toBe("the-full-text");
    });
});

describe("CopyTip", () => {
    test("shows each field's name above its value, the action on the first line and a copy button per field", () => {
        const { container } = render(createElement(CopyTip, {
            fields: [textField("Author", "Ada Author"), codeField("Email", "ada@example.com")],
            action: createElement("button", {}, "Pin"),
        }));
        expect(container.textContent).toBe("AuthorPinAda AuthorEmailada@example.com");
        expect(screen.getByText("Pin").previousElementSibling?.textContent).toBe("Author");
        expect(screen.getByText("ada@example.com").className).toContain("font-[family-name:var(--font-mono)]");
        expect(screen.getByLabelText("Copy author")).toBeTruthy();
        expect(screen.getByLabelText("Copy email")).toBeTruthy();
    });

    test("keeps a multiline field's line breaks", () => {
        render(createElement(CopyTip, {
            fields: [multilineField("Description", "First line.\nSecond line.")],
            action: undefined,
        }));
        expect(screen.getByText(/First line/).className).toContain("whitespace-pre-wrap");
    });

    test("copies a field's value when its button is clicked and shows a tick until COPIED_DURATION_MS has passed", async () => {
        jest.useFakeTimers();
        const writeText = jest.fn().mockResolvedValue(undefined);
        installFakeClipboard(writeText);
        const onRowClick = jest.fn();
        render(createElement("div", {
            onClick: onRowClick,
        }, createElement(CopyTip, {
            fields: [codeField("Email", "ada@example.com")],
            action: undefined,
        })));
        const button = screen.getByLabelText("Copy email");
        await act(async () => {
            button.click();
        });
        expect(writeText).toHaveBeenCalledWith("ada@example.com");
        expect(onRowClick).not.toHaveBeenCalled();
        expect(button.getAttribute("aria-label")).toBe("Copied");
        expect(button.querySelector("svg[data-icon=\"check\"]")).not.toBeNull();
        act(() => {
            jest.advanceTimersByTime(COPIED_DURATION_MS);
        });
        expect(button.getAttribute("aria-label")).toBe("Copy email");
        expect(button.querySelector("svg[data-icon=\"copy\"]")).not.toBeNull();
    });
});

describe("firstFieldAction", () => {
    test("gives the action to the first field and nothing to the rest", () => {
        expect(firstFieldAction(0, "pin")).toBe("pin");
        expect(firstFieldAction(1, "pin")).toBeUndefined();
    });
});

describe("tipButtonFillClass", () => {
    test("fills a pressed button with the hover fill and any other with the tooltip button fill", () => {
        expect(tipButtonFillClass(true)).toBe("bg-[var(--color-tooltip-button-hover)]");
        expect(tipButtonFillClass(false)).toBe("bg-[var(--color-tooltip-button)]");
    });
});

describe("fieldValueClasses", () => {
    test("sets the code font for a code field, kept line breaks for a multiline one and nothing for a text field", () => {
        expect(fieldValueClasses(codeField("Hash", "a1b2c3d"))).toBe(" font-[family-name:var(--font-mono)]");
        expect(fieldValueClasses(multilineField("Description", "Text"))).toBe(" whitespace-pre-wrap");
        expect(fieldValueClasses(textField("Author", "Ada"))).toBe("");
    });
});

describe("PinnableTooltip", () => {
    test("shows its body with the pin button on its first line when the pointer rests on its element", async () => {
        renderPinnable();
        await openPinnable();
        expect(document.querySelector("[data-id=\"the-tip\"]")?.textContent).toBe("Commit hasha1b2c3d4e5f6Short hasha1b2c3d");
        expect(pinButton().getAttribute("data-id")).toBe("the-tip-pin");
        expect(pinButton().getAttribute("aria-label")).toBe("Pin the tooltip (P)");
        expect(pinButton().getAttribute("aria-pressed")).toBe("false");
        expect(pinButton().querySelector("svg[data-icon=\"thumbtack\"]")).not.toBeNull();
    });

    test("closes when the pointer leaves while it is not pinned", async () => {
        renderPinnable();
        await openPinnable();
        fireEvent.mouseLeave(screen.getByText("Target"));
        await waitFor(() => {
            expect(isTipShown()).toBe(false);
        });
    });

    test("pins with its pin button, stays open after the pointer leaves and closes with its close button", async () => {
        renderPinnable();
        await openPinnable();
        fireEvent.click(pinButton());
        expect(pinButton().getAttribute("aria-pressed")).toBe("true");
        expect(pinButton().getAttribute("aria-label")).toBe("Close the tooltip (P or Escape)");
        expect(pinButton().className).toContain("bg-[var(--color-tooltip-button-hover)]");
        expect(pinButton().querySelector("svg[data-icon=\"xmark\"]")).not.toBeNull();
        fireEvent.mouseLeave(screen.getByText("Target"));
        expect(isTipShown()).toBe(true);
        fireEvent.click(pinButton());
        await waitFor(() => {
            expect(isTipShown()).toBe(false);
        });
    });

    test("pins with P and closes with P again", async () => {
        renderPinnable();
        await openPinnable();
        fireEvent.keyDown(document.body, {
            key: "P",
        });
        fireEvent.mouseLeave(screen.getByText("Target"));
        expect(isTipShown()).toBe(true);
        expect(pinButton().getAttribute("aria-pressed")).toBe("true");
        fireEvent.keyDown(document.body, {
            key: "p",
        });
        await waitFor(() => {
            expect(isTipShown()).toBe(false);
        });
    });

    test("closes a pinned tooltip with Escape", async () => {
        renderPinnable();
        await openPinnable();
        fireEvent.keyDown(document.body, {
            key: "p",
        });
        fireEvent.mouseLeave(screen.getByText("Target"));
        fireEvent.keyDown(document.body, {
            key: "Escape",
        });
        await waitFor(() => {
            expect(isTipShown()).toBe(false);
        });
    });

    test("closes an open tooltip with Escape", async () => {
        renderPinnable();
        await openPinnable();
        fireEvent.keyDown(document.body, {
            key: "Escape",
        });
        await waitFor(() => {
            expect(isTipShown()).toBe(false);
        });
    });

    test("keeps P and Escape from the page's own key listener on the document while it is open", async () => {
        renderPinnable();
        await openPinnable();
        const pageKeys = jest.fn();
        document.addEventListener("keydown", pageKeys, true);
        const pin = fireEvent.keyDown(document.body, {
            key: "p",
        });
        const close = fireEvent.keyDown(document.body, {
            key: "Escape",
        });
        expect(pin).toBe(false);
        expect(close).toBe(false);
        expect(pageKeys).not.toHaveBeenCalled();
        document.removeEventListener("keydown", pageKeys, true);
    });

    test("leaves P to a text box and to a key pressed with a modifier", async () => {
        renderPinnable();
        await openPinnable();
        const input = document.createElement("input");
        document.body.appendChild(input);
        fireEvent.keyDown(input, {
            key: "p",
        });
        fireEvent.keyDown(document.body, {
            key: "p",
            ctrlKey: true,
        });
        expect(pinButton().getAttribute("aria-pressed")).toBe("false");
        input.remove();
    });

    test("listens for no keys while it is closed", () => {
        renderPinnable();
        const pageKeys = jest.fn();
        document.addEventListener("keydown", pageKeys, true);
        fireEvent.keyDown(document.body, {
            key: "Escape",
        });
        expect(pageKeys).toHaveBeenCalled();
        document.removeEventListener("keydown", pageKeys, true);
    });
});
