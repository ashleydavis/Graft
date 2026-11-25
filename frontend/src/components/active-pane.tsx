//
// Carries the repo explorer's active pane from the page that holds it up to the layout, which keeps
// the selected pane or page for every part drawn over or beside the page, through a React context
// the layout fills.
//

import { createContext, useContext } from "react";
import { PaneOrPage } from "../lib/active-pane";

//
// What the layout gives the page it shows, so the page can set its active pane.
//
export interface IActivePaneContext {
    // Sets the page's active pane, or undefined when the page closes.
    setActivePane(pane: PaneOrPage | undefined): void;
}

//
// Reports a page that sets its active pane with no layout around it, as the default of
// ActivePaneContext. It writes the error to the console with what to do, because Graft's code
// reports errors in place of throwing them.
//
export function reportMissingActivePaneLayout(pane: PaneOrPage | undefined): void {
    console.error(`Graft could not make ${String(pane)} the active pane, because the page is not inside the layout's ActivePaneContext. The command palette lists the page's commands first, so render the page inside AppLayout.`);
}

//
// The context the layout fills. Outside the layout it holds reportMissingActivePaneLayout, so a
// page that sets its active pane there is reported.
//
export const ActivePaneContext = createContext<IActivePaneContext>({
    setActivePane: reportMissingActivePaneLayout,
});

//
// Reads the function that sets the active pane, for a page inside the layout. The router shows the
// page inside the layout without passing it props, so the page reaches the layout through this
// context.
//
export function useActivePane(): IActivePaneContext {
    return useContext(ActivePaneContext);
}
