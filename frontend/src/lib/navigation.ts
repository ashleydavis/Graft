//
// Opens one of Graft's pages through the router, for the layout and the feature hooks that move
// to a page, and reports a page the router could not open.
//

import type { UseNavigateResult } from "@tanstack/react-router";

//
// Opens the page at the path through the router, with the navigate of the component that calls it.
// A page the router could not open is reported by navigationFailureReporter, so the failure is seen
// in the log rather than lost.
//
export function openPage(navigate: UseNavigateResult<string>, path: string): void {
    navigate({
        to: path,
    }).catch(navigationFailureReporter(path));
}

//
// Makes the function that reports that the router could not open the page at the path, so the
// failure is seen in the log rather than lost, with what to look at.
//
export function navigationFailureReporter(path: string): (error: unknown) => void {
    return error => {
        console.error(`Graft could not open the page at ${path}: ${String(error)}. The page stays as it was, so look at the router's routes for that path.`);
    };
}
