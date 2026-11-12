//
// Tests the copy button: that clicking it writes its text to the clipboard and that a copy the
// clipboard refuses is reported in the log.
//

import { act, render } from "@testing-library/react";
import { createElement } from "react";
import { CopyButton } from "../../components/copy-button";

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

describe("CopyButton", () => {
    test("is labelled as a copy button with its data-id", () => {
        const { container } = render(createElement(CopyButton, {
            dataId: "the-copy",
            text: "git log",
        }));
        const button = container.querySelector("[data-id=\"the-copy\"]");
        expect(button?.getAttribute("aria-label")).toBe("Copy");
        expect(button?.getAttribute("title")).toBe("Copy");
    });

    test("writes its text to the clipboard when clicked", async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        installFakeClipboard(writeText);
        const { container } = render(createElement(CopyButton, {
            dataId: "the-copy",
            text: "git log --max-count=50",
        }));
        await act(async () => {
            container.querySelector<HTMLElement>("[data-id=\"the-copy\"]")?.click();
        });
        expect(writeText).toHaveBeenCalledWith("git log --max-count=50");
    });

    test("reports a copy the clipboard refuses in the log", async () => {
        const writeText = jest.fn().mockRejectedValue(new Error("Not allowed"));
        installFakeClipboard(writeText);
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const { container } = render(createElement(CopyButton, {
            dataId: "the-copy",
            text: "git log",
        }));
        await act(async () => {
            container.querySelector<HTMLElement>("[data-id=\"the-copy\"]")?.click();
        });
        expect(consoleError).toHaveBeenCalledWith("Graft could not copy \"git log\" to the clipboard: Error: Not allowed. Nothing was copied, so look at whether the web view allows the clipboard.");
        consoleError.mockRestore();
    });
});
