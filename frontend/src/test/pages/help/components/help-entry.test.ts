//
// Tests the Help page's entry: renders an entry with a term and text and checks the term shows as
// a dt and the text as a dd, each under a data-id built from the entry's.
//

import { render } from "@testing-library/react";
import { createElement } from "react";
import { HelpEntry } from "../../../../pages/help/components/help-entry";

describe("HelpEntry", () => {
    test("shows the term above its text, each with a data-id built from the entry's", () => {
        const { container } = render(createElement(HelpEntry, {
            term: "Term",
            dataId: "entry",
            children: "What the term does.",
        }));
        const entry = container.querySelector("[data-id=\"entry\"]");
        expect(entry).not.toBeNull();
        const termElement = entry?.querySelector("[data-id=\"entry-term\"]");
        expect(termElement?.tagName).toBe("DT");
        expect(termElement?.textContent).toBe("Term");
        const textElement = entry?.querySelector("[data-id=\"entry-text\"]");
        expect(textElement?.tagName).toBe("DD");
        expect(textElement?.textContent).toBe("What the term does.");
        expect(entry?.children).toHaveLength(2);
        expect(entry?.firstElementChild).toBe(termElement);
    });
});
