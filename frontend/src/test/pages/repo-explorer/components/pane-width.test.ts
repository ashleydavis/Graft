//
// Tests how wide a pane of the repo explorer is: its own width, kept from shrinking, at its usual
// size and the whole of the repo explorer while it is maximised.
//

import { maximisedPaneClasses, paneWidthClass } from "../../../../pages/repo-explorer/components/pane-width";

describe("paneWidthClass", () => {
    test("is the pane's own width, kept from shrinking, at its usual size", () => {
        expect(paneWidthClass("w-[360px]", false)).toBe("w-[360px] flex-none");
    });

    test("grows to fill the repo explorer while the pane is maximised", () => {
        expect(paneWidthClass("w-[360px]", true)).toBe(maximisedPaneClasses);
        expect(maximisedPaneClasses).toBe("min-w-0 flex-1");
    });
});
