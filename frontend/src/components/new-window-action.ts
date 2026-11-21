//
// The new-window action's handler, which opens another window of Graft, registered by the hook the
// layout calls.
//

import { useEffect } from "react";
import { newWindowActionName, openNewWindow } from "../lib/new-window";

//
// Registers the handler of the new-window action for as long as the component that calls it is
// shown. The layout calls it, so the action works on every page. The handler calls only
// window.ziggy, so it is registered once.
//
export function useNewWindowAction(): void {
    useEffect(() => {
        window.ziggy.registerAction(newWindowActionName, openNewWindow);
        return () => {
            window.ziggy.removeAction(newWindowActionName);
        };
    }, []);
}
