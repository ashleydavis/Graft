//
// Carries the breadcrumb trail's pane steps from the page that opens the panes up to the layout
// that draws the trail, through a React context the layout fills.
//

import { createContext, useContext } from "react";
import { ITrailStep } from "../lib/breadcrumb-trail";

//
// What the layout gives the page it shows, so the page can put its open panes in the trail.
//
export interface IPaneTrailContext {
    // Sets the steps that follow the page's own step in the trail, one per open pane, or none.
    setPaneSteps(steps: ITrailStep[]): void;
}

//
// Reports a page that sets its pane steps with no layout around it, as the default of
// PaneTrailContext. Graft's code does not throw, so the error goes to the console with what to do,
// and the trail, which only the layout draws, shows no pane steps.
//
export function reportMissingLayout(steps: ITrailStep[]): void {
    console.error(`Graft could not put ${steps.length} pane steps in the breadcrumb trail, because the page is not inside the layout's PaneTrailContext. The trail shows no panes, so render the page inside AppLayout.`);
}

//
// The context the layout fills. Outside the layout it holds reportMissingLayout, so a page that
// sets its pane steps there is reported.
//
export const PaneTrailContext = createContext<IPaneTrailContext>({
    setPaneSteps: reportMissingLayout,
});

//
// Reads the function that sets the trail's pane steps, for a page inside the layout. The layout
// owns the trail and the page owns its panes, and the router shows the page inside the layout
// without passing it props, so the page reaches the layout through this context.
//
export function usePaneTrail(): IPaneTrailContext {
    return useContext(PaneTrailContext);
}
