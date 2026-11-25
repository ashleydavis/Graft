//
// Tests copying text to the clipboard: that the text is written and onCopied called once it is
// there. It checks a copy the clipboard refuses is reported in the log and onCopied not called.
//

import { COPIED_DURATION_MS, copyText } from "../../lib/clipboard";

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

describe("copyText", () => {
    test("shows a copy button's tick for a second and a half", () => {
        expect(COPIED_DURATION_MS).toBe(1500);
    });

    test("writes the text to the clipboard and calls onCopied once it is there", async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        installFakeClipboard(writeText);
        const onCopied = jest.fn();
        copyText("a1b2c3d", onCopied);
        await Promise.resolve();
        await Promise.resolve();
        expect(writeText).toHaveBeenCalledWith("a1b2c3d");
        expect(onCopied).toHaveBeenCalledTimes(1);
    });

    test("reports a copy the clipboard refuses in the log and does not call onCopied", async () => {
        installFakeClipboard(jest.fn().mockRejectedValue(new Error("Not allowed")));
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const onCopied = jest.fn();
        copyText("a1b2c3d", onCopied);
        await Promise.resolve();
        await Promise.resolve();
        expect(consoleError).toHaveBeenCalledWith("Graft could not copy \"a1b2c3d\" to the clipboard: Error: Not allowed. Nothing was copied, so look at whether the web view allows the clipboard.");
        expect(onCopied).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
