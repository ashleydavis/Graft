//
// Tests the context that carries the breadcrumb trail's pane steps up to the layout: usePaneTrail
// gives a page the setPaneSteps of the PaneTrailContext around it, and outside one the page's steps
// are reported on the console.
//

import { render } from "@testing-library/react";
import { createElement, JSX } from "react";
import { PaneTrailContext, usePaneTrail } from "../../components/pane-trail";

//
// Puts a Commits step in the trail as it draws, as a page with the commit pane open does.
//
function PaneSetter(): JSX.Element {
    const { setPaneSteps } = usePaneTrail();
    setPaneSteps([
        {
            label: "Commits",
            tooltip: "Commits",
            dataId: "breadcrumb-pane-commits",
            options: [],
        },
    ]);
    return createElement("p", null, "The page");
}

describe("usePaneTrail", () => {
    test("gives the page the setPaneSteps of the context around it", () => {
        const setPaneSteps = jest.fn();
        render(createElement(PaneTrailContext.Provider, {
            value: {
                setPaneSteps,
            },
            children: createElement(PaneSetter),
        }));
        expect(setPaneSteps).toHaveBeenCalledWith([
            {
                label: "Commits",
                tooltip: "Commits",
                dataId: "breadcrumb-pane-commits",
                options: [],
            },
        ]);
    });

    test("reports the page's steps on the console outside PaneTrailContext", () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        render(createElement(PaneSetter));
        expect(consoleError).toHaveBeenCalledWith("Graft could not put 1 pane steps in the breadcrumb trail, because the page is not inside the layout's PaneTrailContext. The trail shows no panes, so render the page inside AppLayout.");
        consoleError.mockRestore();
    });
});
