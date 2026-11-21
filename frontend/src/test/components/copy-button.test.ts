//
// Tests the copy button: that it is named by its label, that clicking it writes its text to the
// clipboard and shows "Copied" with a tick until COPIED_DURATION_MS has passed, and that a copy the
// clipboard refuses is reported in the log and shows no tick.
//

import { act, render } from "@testing-library/react";
import { createElement } from "react";
import { COPIED_DURATION_MS, CopyButton } from "../../components/copy-button";

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
// Renders a copy button of the text, labelled "Copy command", and returns the button.
//
function renderCopyButton(text: string): HTMLElement | undefined {
    const { container } = render(createElement(CopyButton, {
        dataId: "the-copy",
        text,
        label: "Copy command",
    }));
    return container.querySelector<HTMLElement>("[data-id=\"the-copy\"]") ?? undefined;
}

describe("CopyButton", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    test("shows the tick for a second and a half", () => {
        expect(COPIED_DURATION_MS).toBe(1500);
    });

    test("is named by its label and shows the copy icon", () => {
        const button = renderCopyButton("git log");
        expect(button?.getAttribute("aria-label")).toBe("Copy command");
        expect(button?.querySelector("svg[data-icon=\"copy\"]")).not.toBeNull();
    });

    test("writes its text to the clipboard when clicked", async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        installFakeClipboard(writeText);
        const button = renderCopyButton("git log --max-count=50");
        await act(async () => {
            button?.click();
        });
        expect(writeText).toHaveBeenCalledWith("git log --max-count=50");
    });

    test("says Copied with a tick once copied, then goes back to its label", async () => {
        jest.useFakeTimers();
        installFakeClipboard(jest.fn().mockResolvedValue(undefined));
        const button = renderCopyButton("git log");
        await act(async () => {
            button?.click();
        });
        expect(button?.getAttribute("aria-label")).toBe("Copied");
        expect(button?.querySelector("svg[data-icon=\"check\"]")).not.toBeNull();
        expect(button?.classList.contains("text-[var(--color-success)]")).toBe(true);
        act(() => {
            jest.advanceTimersByTime(COPIED_DURATION_MS - 1);
        });
        expect(button?.getAttribute("aria-label")).toBe("Copied");
        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(button?.getAttribute("aria-label")).toBe("Copy command");
        expect(button?.querySelector("svg[data-icon=\"copy\"]")).not.toBeNull();
    });

    test("reports a copy the clipboard refuses in the log and shows no tick", async () => {
        const writeText = jest.fn().mockRejectedValue(new Error("Not allowed"));
        installFakeClipboard(writeText);
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const button = renderCopyButton("git log");
        await act(async () => {
            button?.click();
        });
        expect(consoleError).toHaveBeenCalledWith("Graft could not copy \"git log\" to the clipboard: Error: Not allowed. Nothing was copied, so look at whether the web view allows the clipboard.");
        expect(button?.getAttribute("aria-label")).toBe("Copy command");
        consoleError.mockRestore();
    });
});
