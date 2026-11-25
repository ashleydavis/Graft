//
// Tests the context that carries the repo explorer's active pane up to the layout: useActivePane
// gives a page the setActivePane of the ActivePaneContext around it, and outside one the pane is
// reported on the console.
//

import { render } from "@testing-library/react";
import { createElement, JSX } from "react";
import { ActivePaneContext, useActivePane } from "../../components/active-pane";

//
// Makes the commit pane the active pane as it draws, as the repo explorer page does.
//
function PaneSetter(): JSX.Element {
    const { setActivePane } = useActivePane();
    setActivePane("commit-pane");
    return createElement("p", null, "The page");
}

describe("useActivePane", () => {
    test("gives the page the setActivePane of the context around it", () => {
        const setActivePane = jest.fn();
        render(createElement(ActivePaneContext.Provider, {
            value: {
                setActivePane,
            },
            children: createElement(PaneSetter),
        }));
        expect(setActivePane).toHaveBeenCalledWith("commit-pane");
    });

    test("reports the active pane on the console outside ActivePaneContext", () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        render(createElement(PaneSetter));
        expect(consoleError).toHaveBeenCalledWith("Graft could not make commit-pane the active pane, because the page is not inside the layout's ActivePaneContext. The command palette lists the page's commands first, so render the page inside AppLayout.");
        consoleError.mockRestore();
    });
});
